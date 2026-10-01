using System.Text.Json;

namespace SysOverRay;

public sealed class OverlaySettings
{
    public string GreenlyRoot { get; set; } = @"..\..";
    public int StartupTimeoutSeconds { get; set; } = 120;
    public int ShutdownTimeoutSeconds { get; set; } = 20;
    public int FrontendPortRangeStart { get; set; } = 5173;
    public int FrontendPortRangeEnd { get; set; } = 5175;
    public int[] BackendPorts { get; set; } = [8080, 18081, 18082];

    public string ProjectRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, GreenlyRoot));
    public string StartScriptPath => Path.Combine(ProjectRoot, "start.ps1");

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
            return settings ?? new OverlaySettings();
        }
        catch (Exception ex)
        {
            AppLog.Write($"Could not read settings; defaults are used: {ex}");
            return new OverlaySettings();
        }
    }
}
