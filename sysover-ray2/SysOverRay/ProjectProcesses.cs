using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SysOverRay;

// Match the configured checkout's launchers/tools, never a port alone.
internal sealed class ProjectProcesses(string projectRoot)
{
    private readonly string _root = Path.GetFullPath(projectRoot).TrimEnd('\\', '/');
    private sealed record Entry(int Id, string Created, string Command, string Name);

    private async Task<Entry[]> FindAsync()
    {
        const string script = "@(Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('powershell.exe','pwsh.exe','node.exe','uv.exe') } | ForEach-Object { @{ Id=[int]$_.ProcessId; Created=$_.CreationDate.ToUniversalTime().ToString('o'); Command=[string]$_.CommandLine; Name=$_.Name } }) | ConvertTo-Json -Compress";
        var info = new ProcessStartInfo("powershell.exe")
        {
            UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true
        };
        info.ArgumentList.Add("-NoProfile");
        info.ArgumentList.Add("-EncodedCommand");
        info.ArgumentList.Add(Convert.ToBase64String(Encoding.Unicode.GetBytes(script)));
        using var process = Process.Start(info) ?? throw new InvalidOperationException("プロセスを確認できません。");
        var output = process.StandardOutput.ReadToEndAsync();
        var error = process.StandardError.ReadToEndAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        await process.WaitForExitAsync(timeout.Token);
        if (process.ExitCode != 0) throw new InvalidOperationException("Greenlyのプロセス確認に失敗しました。");
        await error;
        var json = await output;
        if (string.IsNullOrWhiteSpace(json)) return [];
        using var document = JsonDocument.Parse(json);
        var entries = document.RootElement.ValueKind == JsonValueKind.Array
            ? JsonSerializer.Deserialize<Entry[]>(json)!
            : [JsonSerializer.Deserialize<Entry>(json)!];
        return entries.Where(IsProjectProcess).ToArray();
    }

    private bool IsProjectProcess(Entry entry)
    {
        var command = entry.Command.Replace('/', '\\');
        bool ContainsPath(string suffix) => Regex.IsMatch(command,
            "(?:^|[\\s\"'])" + Regex.Escape(_root + suffix) + "(?=$|[\\s\"'])", RegexOptions.IgnoreCase);
        bool ContainsBackendPath() => ContainsPath("\\backend");
        bool IsLauncher()
        {
            // A -Command shell can mention the path as data; it is not a launcher.
            if (Regex.IsMatch(command, @"(?:^|\s)-(?:Command|EncodedCommand)\b", RegexOptions.IgnoreCase)) return false;
            var file = Regex.Match(command, "(?:^|\\s)-File\\s+(?:\"([^\"]+)\"|([^\\s]+))", RegexOptions.IgnoreCase);
            if (!file.Success) return false;
            var path = file.Groups[1].Success ? file.Groups[1].Value : file.Groups[2].Value;
            return path.Equals(_root + "\\start.ps1", StringComparison.OrdinalIgnoreCase) ||
                path.Equals(_root + "\\scripts\\start.ps1", StringComparison.OrdinalIgnoreCase);
        }
        return entry.Name.ToLowerInvariant() switch
        {
            "powershell.exe" or "pwsh.exe" => IsLauncher(),
            "node.exe" => ContainsPath("\\node_modules\\.bin\\\\..\\vite\\bin\\vite.js") || ContainsPath("\\node_modules\\vite\\bin\\vite.js"),
            "uv.exe" => ContainsBackendPath() && Regex.IsMatch(command, @"(?:^|\s)run(?:\s|$)", RegexOptions.IgnoreCase),
            _ => false
        };
    }

    public async Task<bool> AnyAsync() => (await FindAsync()).Length > 0;

    public async Task StopAsync()
    {
        var deadline = DateTime.UtcNow.AddSeconds(20);
        while (DateTime.UtcNow < deadline)
        {
            var candidates = await FindAsync();
            if (candidates.Length == 0) return;
            foreach (var entry in candidates)
            {
                // Recheck command and creation time to avoid killing a reused PID.
                if (!(await FindAsync()).Any(current => current.Id == entry.Id && current.Created == entry.Created)) continue;
                try
                {
                    using var process = Process.GetProcessById(entry.Id);
                    process.Kill(entireProcessTree: true);
                    await process.WaitForExitAsync();
                }
                catch (ArgumentException) { }
                catch (InvalidOperationException) { }
            }
            await Task.Delay(500);
        }
        if (await AnyAsync()) throw new InvalidOperationException("Greenlyのプロセスが残っています。ログを確認してください。");
    }
}
