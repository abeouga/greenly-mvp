using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SysOverRay;

public sealed class GreenlyController
{
    private static readonly string[] RequiredAssetIds = ["tree_oak", "shrub_boxwood", "brick_paver", "bench_wood"];
    private readonly OverlaySettings _settings;
    private readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(2) };
    private Process? _launcher;
    private readonly ProjectProcesses _processes;
    private bool _projectRunning;
    private bool LauncherActive => _launcher is { HasExited: false };
    private int? _frontendPort;
    private int? _backendPort;
    private HashSet<int> _frontendPortsBeforeStart = [];
    private int? _backendPortBeforeStart;
    private bool? _ownsBackend;
    private string? _stopSignalPath;
    private ServiceStatus _lastStatus = new(false, false, null, null);

    public GreenlyController(OverlaySettings settings)
    {
        _settings = settings;
        _processes = new ProjectProcesses(settings.ProjectRoot);
    }

    public bool CanStart => !LauncherActive && !_projectRunning;
    public bool CanStop => LauncherActive || _projectRunning;
    public string? FrontendUrl => _lastStatus.FrontendUrl;

    public async Task<ServiceStatus> GetStatusAsync()
    {
        var launcherActive = LauncherActive;
        _projectRunning = await _processes.AnyAsync();
        var frontendPorts = _frontendPort is int webPort
            ? [webPort]
            : Enumerable.Range(_settings.FrontendPortRangeStart, _settings.FrontendPortRangeEnd - _settings.FrontendPortRangeStart + 1);
        var backendPorts = _backendPort is int apiPort ? [apiPort] : _settings.BackendPorts;
        var frontendTask = CheckFrontendAsync(frontendPorts, launcherActive ? _frontendPortsBeforeStart : null, launcherActive);
        var backendTask = CheckBackendAsync(backendPorts, launcherActive ? _backendPortBeforeStart : null);
        await Task.WhenAll(frontendTask, backendTask);
        var frontend = await frontendTask;
        var backend = await backendTask;
        if (_frontendPort is null) _frontendPort = frontend.Port;
        if (_backendPort is null) _backendPort = backend.Port;
        _lastStatus = new ServiceStatus(backend.Healthy, frontend.Healthy,
            frontend.Port is int fp ? $"http://127.0.0.1:{fp}" : null,
            backend.Port is int bp ? $"http://127.0.0.1:{bp}" : null);
        return _lastStatus;
    }

    public async Task StartAsync()
    {
        ValidateConfiguration();
        await GetStatusAsync();
        if (LauncherActive || (_projectRunning && _lastStatus.BothHealthy))
        {
            await WaitForStatusAsync(status => status.BothHealthy, _settings.StartupTimeoutSeconds,
                "Greenlyの起動確認がタイムアウトしました。ログを確認してください。");
            return;
        }

        var candidateWebPorts = Enumerable.Range(_settings.FrontendPortRangeStart,
            _settings.FrontendPortRangeEnd - _settings.FrontendPortRangeStart + 1);
        var occupiedWebPorts = new HashSet<int>();
        foreach (var port in candidateWebPorts)
        {
            if ((await CheckFrontendAsync([port], oldPorts: null, requireNew: false)).Healthy)
                occupiedWebPorts.Add(port);
        }
        var existingBackend = await CheckBackendAsync(_settings.BackendPorts, oldPort: null);
        // A stopped service may leave its last detected port in the controller.
        // Only a service that is healthy immediately before launch may be treated
        // as an existing process that the new managed session must not claim.
        _frontendPortsBeforeStart = occupiedWebPorts;
        _backendPortBeforeStart = existingBackend.Healthy ? existingBackend.Port : null;
        _frontendPort = null;
        _backendPort = null;

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            WorkingDirectory = _settings.ProjectRoot,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
        startInfo.ArgumentList.Add("-NoLogo");
        startInfo.ArgumentList.Add("-NoProfile");
        startInfo.ArgumentList.Add("-ExecutionPolicy");
        startInfo.ArgumentList.Add("Bypass");
        startInfo.ArgumentList.Add("-File");
        startInfo.ArgumentList.Add(_settings.StartScriptPath);
        startInfo.ArgumentList.Add("-NoBrowser");
        var logDirectory = Path.GetDirectoryName(AppLog.FilePath)!;
        Directory.CreateDirectory(logDirectory);
        _stopSignalPath = Path.Combine(logDirectory, $"greenly-stop-{Guid.NewGuid():N}.signal");
        startInfo.Environment["GREENLY_STOP_REQUEST_PATH"] = _stopSignalPath;

        _launcher = Process.Start(startInfo) ?? throw new InvalidOperationException("Greenlyの起動処理を開始できませんでした。");
        _launcher.OutputDataReceived += (_, e) => RecordLauncherOutput(e.Data, isError: false);
        _launcher.ErrorDataReceived += (_, e) => RecordLauncherOutput(e.Data, isError: true);
        _launcher.BeginOutputReadLine();
        _launcher.BeginErrorReadLine();
        AppLog.Write($"Started Greenly launcher PID {_launcher.Id}.");

        await WaitForStatusAsync(status => status.BothHealthy, _settings.StartupTimeoutSeconds,
            "Greenlyの起動確認がタイムアウトしました。ログを確認してください。");
        AppLog.Write($"Greenly is available at {_lastStatus.FrontendUrl} (API {_lastStatus.BackendUrl}).");
    }

    public async Task StopAsync()
    {
        if (LauncherActive && _stopSignalPath is not null)
        {
            await File.WriteAllTextAsync(_stopSignalPath, "stop");
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(_settings.ShutdownTimeoutSeconds));
            try { await _launcher!.WaitForExitAsync(timeout.Token); }
            catch (OperationCanceledException) { AppLog.Write("Graceful stop timed out; stopping verified project processes."); }
        }
        await _processes.StopAsync();
        _launcher?.Dispose();
        _launcher = null;
        _stopSignalPath = null;
        _frontendPort = null;
        _backendPort = null;
        _frontendPortsBeforeStart.Clear();
        _ownsBackend = null;
        _projectRunning = false;
        await GetStatusAsync();
        AppLog.Write("Configured Greenly project processes stopped.");
    }

    public async Task RestartAsync()
    {
        await StopAsync();
        await Task.Delay(500);
        await StartAsync();
    }

    private void RecordLauncherOutput(string? line, bool isError)
    {
        if (string.IsNullOrWhiteSpace(line)) return;
        AppLog.Write($"Greenly {(isError ? "stderr" : "stdout")}: {line}");
        var urlMatch = Regex.Match(line, @"(?:http://)?127\.0\.0\.1:(\d+)");
        if (!urlMatch.Success) return;
        var port = int.Parse(urlMatch.Groups[1].Value);
        if (line.Contains("Greenly Web:", StringComparison.OrdinalIgnoreCase) || line.Contains("Web起動中", StringComparison.OrdinalIgnoreCase))
            _frontendPort = port;
        if (line.Contains("Greenly API:", StringComparison.OrdinalIgnoreCase) || line.Contains("API起動中", StringComparison.OrdinalIgnoreCase) || line.Contains("既存のGreenly API", StringComparison.OrdinalIgnoreCase))
        {
            _backendPort = port;
            _ownsBackend = !line.Contains("既存のGreenly API", StringComparison.OrdinalIgnoreCase);
        }
    }

    private async Task<(bool Healthy, int? Port)> CheckFrontendAsync(IEnumerable<int> ports, IReadOnlySet<int>? oldPorts, bool requireNew)
    {
        int? oldHealthyPort = null;
        foreach (var port in ports)
        {
            try
            {
                using var response = await _httpClient.GetAsync($"http://127.0.0.1:{port}/");
                if (!response.IsSuccessStatusCode) continue;
                var content = await response.Content.ReadAsStringAsync();
                if (content.Contains("Greenly", StringComparison.OrdinalIgnoreCase))
                {
                    if (oldPorts?.Contains(port) != true) return (true, port);
                    oldHealthyPort = port;
                }
            }
            catch (HttpRequestException) { }
            catch (TaskCanceledException) { }
        }
        return requireNew ? (false, _frontendPort) : (oldHealthyPort is not null, oldHealthyPort ?? _frontendPort);
    }

    private async Task<(bool Healthy, int? Port)> CheckBackendAsync(IEnumerable<int> ports, int? oldPort)
    {
        int? oldHealthyPort = null;
        foreach (var port in ports)
        {
            try
            {
                using var response = await _httpClient.GetAsync($"http://127.0.0.1:{port}/api/assets");
                if (!response.IsSuccessStatusCode) continue;
                using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                var ids = document.RootElement.EnumerateArray()
                    .Select(asset => asset.TryGetProperty("id", out var id) ? id.GetString() : null)
                    .ToHashSet(StringComparer.Ordinal);
                if (RequiredAssetIds.All(ids.Contains))
                {
                    if (port != oldPort) return (true, port);
                    oldHealthyPort = port;
                }
            }
            catch (HttpRequestException) { }
            catch (TaskCanceledException) { }
            catch (JsonException) { }
        }
        return (oldHealthyPort is not null, oldHealthyPort ?? _backendPort);
    }

    private async Task WaitForStatusAsync(Func<ServiceStatus, bool> predicate, int timeoutSeconds, string message)
    {
        var deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
        while (DateTime.UtcNow < deadline)
        {
            if (_launcher is { HasExited: true })
                throw new InvalidOperationException("Greenlyの起動プロセスが終了しました。オーバーレイのログを確認してください。");
            if (predicate(await GetStatusAsync())) return;
            await Task.Delay(500);
        }
        throw new TimeoutException(message);
    }

    private void ValidateConfiguration()
    {
        if (!Directory.Exists(_settings.ProjectRoot))
            throw new DirectoryNotFoundException($"Greenlyのフォルダーが見つかりません: {_settings.ProjectRoot}");
        if (!File.Exists(_settings.StartScriptPath))
            throw new FileNotFoundException("Greenlyの起動スクリプトが見つかりません。", _settings.StartScriptPath);
        if (_settings.FrontendPortRangeStart < 1 || _settings.FrontendPortRangeEnd > 65535 ||
            _settings.FrontendPortRangeStart > _settings.FrontendPortRangeEnd || _settings.BackendPorts.Length == 0)
            throw new InvalidOperationException("Greenlyのポート設定が不正です。");
    }

}

public readonly record struct ServiceStatus(bool BackendHealthy, bool FrontendHealthy, string? FrontendUrl, string? BackendUrl)
{
    public bool BothHealthy => BackendHealthy && FrontendHealthy;
    public bool AnyHealthy => BackendHealthy || FrontendHealthy;
}
