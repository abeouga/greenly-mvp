using System.Text.Json;

namespace SysOverRay;

public sealed class OverlaySettings
{
    public string ProjectRoot { get; set; } = @"..\..";
    public int StartupTimeoutSeconds { get; set; } = 120;
    public int ShutdownTimeoutSeconds { get; set; } = 20;
    public int FrontendPortRangeStart { get; set; } = 5173;
    public int FrontendPortRangeEnd { get; set; } = 5199;
    public int[] BackendPorts { get; set; } =
        [8080, 18081, 18082, 18083, 18084, 18085, 18086, 18087, 18088, 18089, 18090,
         18091, 18092, 18093, 18094, 18095, 18096, 18097, 18098, 18099, 18100];

    public string ResolvedProjectRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, ProjectRoot));
    public string StartScriptPath => Path.Combine(ResolvedProjectRoot, "start.ps1");

    public static OverlaySettings Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "overlay-settings.json");
        if (!File.Exists(path))
        {
            AppLog.Write($"Settings file not found; defaults are used: {path}");
            return new OverlaySettings();
        }

        try
        {
            var settings = JsonSerializer.Deserialize<OverlaySettings>(File.ReadAllText(path), new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            if (settings is null) return new OverlaySettings();
            if (string.IsNullOrWhiteSpace(settings.ProjectRoot) || settings.BackendPorts is null || settings.BackendPorts.Length == 0)
                throw new JsonException("ProjectRoot or BackendPorts is missing.");
            if (settings.StartupTimeoutSeconds < 5 || settings.ShutdownTimeoutSeconds < 1 ||
                settings.FrontendPortRangeStart < 1 || settings.FrontendPortRangeEnd > 65535 ||
                settings.FrontendPortRangeStart > settings.FrontendPortRangeEnd ||
                settings.BackendPorts.Any(port => port < 1 || port > 65535))
                throw new JsonException("Overlay timeouts or ports are outside the supported range.");
            return settings;
        }
        catch (Exception ex)
        {
            AppLog.Write($"Could not read settings; defaults are used: {ex}");
            return new OverlaySettings();
        }
    }
}
