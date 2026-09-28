using System.Text.Json;
using SysOverRay;

var destinationRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var greenlyRoot = Path.GetFullPath(Path.Combine(destinationRoot, "..", "gleenly-mvp"));
var settings = new OverlaySettings
{
    GreenlyRoot = Path.GetRelativePath(AppContext.BaseDirectory, greenlyRoot),
    StartupTimeoutSeconds = 180,
    ShutdownTimeoutSeconds = 20
};
var controller = new GreenlyController(settings);
var observations = new List<object>();

void Record(string step, ServiceStatus status)
{
    observations.Add(new
    {
        step,
        frontendHealthy = status.FrontendHealthy,
        frontendUrl = status.FrontendUrl,
        backendHealthy = status.BackendHealthy,
        backendUrl = status.BackendUrl,
        observedAt = DateTimeOffset.Now
    });
    Console.WriteLine($"{step}: web={status.FrontendUrl ?? "stopped"} ({status.FrontendHealthy}), api={status.BackendUrl ?? "stopped"} ({status.BackendHealthy})");
}

try
{
    Record("baseline", await controller.GetStatusAsync());
    await controller.StartAsync();
    var started = await controller.GetStatusAsync();
    Record("start", started);
    if (!started.BothHealthy) throw new InvalidOperationException("Start did not produce healthy Greenly Web and API.");
    if (new Uri(started.FrontendUrl!).Port == 5173)
        throw new InvalidOperationException($"Occupied Web port 5173 was selected: {started.FrontendUrl}.");

    await controller.StopAsync();
    var stopped = await controller.GetStatusAsync();
    Record("stop", stopped);
    if (stopped.FrontendHealthy) throw new InvalidOperationException("Managed Greenly Web remained healthy after stop.");

    await controller.StartAsync();
    var restartedFromStopped = await controller.GetStatusAsync();
    Record("start-after-stop", restartedFromStopped);
    if (!restartedFromStopped.BothHealthy) throw new InvalidOperationException("Start after stop failed.");

    await controller.RestartAsync();
    var restarted = await controller.GetStatusAsync();
    Record("restart", restarted);
    if (!restarted.BothHealthy) throw new InvalidOperationException("Restart did not recover both services.");

    await controller.StopAsync();
    var final = await controller.GetStatusAsync();
    Record("final-stop", final);
    if (final.FrontendHealthy) throw new InvalidOperationException("Managed Greenly Web remained after final stop.");
}
finally
{
    if (controller.CanStop) await controller.StopAsync();
}

var report = new
{
    result = "passed",
    test = "GreenlyController real start/stop/restart with occupied preferred ports",
    overlaySource = Path.GetFullPath(Path.Combine(destinationRoot, "SysOverRay")),
    greenlyRoot,
    observations
};
var reportPath = Path.Combine(destinationRoot, "verification", "lifecycle-report.json");
await File.WriteAllTextAsync(reportPath, JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
Console.WriteLine($"REPORT: {reportPath}");
