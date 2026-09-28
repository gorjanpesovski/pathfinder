$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class PathfinderClipboard {
  [DllImport("user32.dll")] static extern bool OpenClipboard(IntPtr owner);
  [DllImport("user32.dll")] static extern bool CloseClipboard();
  [DllImport("user32.dll")] static extern bool EmptyClipboard();
  [DllImport("user32.dll")] static extern IntPtr GetClipboardData(uint format);
  [DllImport("user32.dll")] static extern IntPtr SetClipboardData(uint format, IntPtr handle);
  [DllImport("user32.dll")] static extern bool IsClipboardFormatAvailable(uint format);
  [DllImport("user32.dll")] public static extern uint GetClipboardSequenceNumber();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern uint RegisterClipboardFormat(string name);
  [DllImport("kernel32.dll")] static extern IntPtr GlobalAlloc(uint flags, UIntPtr size);
  [DllImport("kernel32.dll")] static extern IntPtr GlobalLock(IntPtr handle);
  [DllImport("kernel32.dll")] static extern bool GlobalUnlock(IntPtr handle);
  [DllImport("kernel32.dll")] static extern UIntPtr GlobalSize(IntPtr handle);

  const string Marker = "PATHFINDER-CLIPBOARD 1";
  const string Blocks = "ISaGRAF.ISaGRAF5.Core.Shell.Isa5EncryptedObject";
  const string Pous = "WindowsForms10PersistentObject";
  const string Placeholder = "PATHFINDER__KEY_";
  static readonly string KeyFile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Pathfinder", "cstrategy-key.txt");
  static readonly string PouKeyFile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Pathfinder", "cstrategy-pou-key.txt");

  static bool Open() {
    for (int attempt = 0; attempt < 40; attempt++) {
      if (OpenClipboard(IntPtr.Zero)) return true;
      Thread.Sleep(25);
    }
    return false;
  }

  static byte[] ReadFormat(uint format) {
    IntPtr handle = GetClipboardData(format);
    if (handle == IntPtr.Zero) return null;
    IntPtr pointer = GlobalLock(handle);
    try {
      byte[] data = new byte[(int)GlobalSize(handle).ToUInt64()];
      Marshal.Copy(pointer, data, 0, data.Length);
      return data;
    } finally {
      GlobalUnlock(handle);
    }
  }

  static void Put(string name, byte[] data) {
    IntPtr handle = GlobalAlloc(0x0002, (UIntPtr)data.Length);
    IntPtr pointer = GlobalLock(handle);
    Marshal.Copy(data, 0, pointer, data.Length);
    GlobalUnlock(handle);
    SetClipboardData(RegisterClipboardFormat(name), handle);
  }

  static int IndexOf(byte[] data, byte[] pattern) {
    for (int index = 0; index + pattern.Length <= data.Length; index++) {
      int match = 0;
      while (match < pattern.Length && data[index + match] == pattern[match]) match++;
      if (match == pattern.Length) return index;
    }
    return -1;
  }

  static int KeyStart(byte[] data) {
    int index = IndexOf(data, Encoding.ASCII.GetBytes("\u0007_object"));
    if (index < 0) return -1;
    int start = index + 8 + 2 + 4;
    return start < data.Length && data[start] == 6 ? start + 5 : -1;
  }

  static string ReadKey(byte[] data) {
    int start = KeyStart(data);
    if (start < 0 || data[start] >= 0x80) return null;
    return Encoding.UTF8.GetString(data, start + 1, data[start]);
  }

  static byte[] WithKey(byte[] data, string key) {
    int start = KeyStart(data);
    if (start < 0 || data[start] >= 0x80) return data;
    byte[] bytes = Encoding.UTF8.GetBytes(key);
    byte[] result = new byte[data.Length - data[start] + bytes.Length];
    Array.Copy(data, 0, result, 0, start);
    result[start] = (byte)bytes.Length;
    Array.Copy(bytes, 0, result, start + 1, bytes.Length);
    Array.Copy(data, start + 1 + data[start], result, start + 1 + bytes.Length, data.Length - start - 1 - data[start]);
    return result;
  }

  public static string Key() {
    return File.Exists(KeyFile) ? File.ReadAllText(KeyFile) : null;
  }

  public static string PouKey() {
    return File.Exists(PouKeyFile) ? File.ReadAllText(PouKeyFile) : null;
  }

  static string ReadPouKey(byte[] data) {
    if (IndexOf(data, Encoding.ASCII.GetBytes("Isa5DataBox")) < 0) return null;
    var counts = new System.Collections.Generic.Dictionary<string, int>();
    for (int index = 0; index + 22 <= data.Length; index++) {
      if (data[index] != 6 || data[index + 5] != 16) continue;
      bool hex = true;
      for (int offset = 0; offset < 16 && hex; offset++) {
        byte value = data[index + 6 + offset];
        hex = (value >= 48 && value <= 57) || (value >= 65 && value <= 70);
      }
      if (!hex) continue;
      string key = Encoding.ASCII.GetString(data, index + 6, 16);
      counts[key] = counts.ContainsKey(key) ? counts[key] + 1 : 1;
    }
    string best = null;
    foreach (var pair in counts) if (best == null || pair.Value > counts[best]) best = pair.Key;
    return best;
  }

  static byte[] WithPouKey(byte[] data, string key) {
    byte[] pattern = Encoding.ASCII.GetBytes((char)16 + Placeholder);
    byte[] bytes = Encoding.ASCII.GetBytes(key);
    var result = new System.Collections.Generic.List<byte>(data.Length);
    int index = 0;
    while (index < data.Length) {
      if (data[index] == 16 && Matches(data, pattern, index)) {
        result.Add((byte)bytes.Length);
        result.AddRange(bytes);
        index += pattern.Length;
      } else {
        result.Add(data[index++]);
      }
    }
    return result.ToArray();
  }

  static bool Matches(byte[] data, byte[] pattern, int at) {
    if (at + pattern.Length > data.Length) return false;
    for (int offset = 0; offset < pattern.Length; offset++) if (data[at + offset] != pattern[offset]) return false;
    return true;
  }

  static string Remember(string file, string key, string label) {
    if (string.IsNullOrEmpty(key) || (File.Exists(file) && File.ReadAllText(file) == key)) return null;
    Directory.CreateDirectory(Path.GetDirectoryName(file));
    File.WriteAllText(file, key);
    return "Learned the c.strategy " + label + " from your copy";
  }

  public static string Process() {
    if (!Open()) return null;
    string text = null;
    try {
      byte[] copied = ReadFormat(RegisterClipboardFormat(Blocks));
      if (copied != null) return Remember(KeyFile, ReadKey(copied), "project key");
      byte[] pou = ReadFormat(RegisterClipboardFormat(Pous));
      if (pou != null) return Remember(PouKeyFile, ReadPouKey(pou), "POU key");
      if (!IsClipboardFormatAvailable(13)) return null;
      byte[] raw = ReadFormat(13);
      if (raw == null) return null;
      text = Encoding.Unicode.GetString(raw).TrimEnd('\0');
    } finally {
      CloseClipboard();
    }
    if (!text.StartsWith(Marker)) return null;
    string[] lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
    bool pouCopy = Array.Exists(lines, (line) => line.StartsWith(Pous + "\t"));
    string known = pouCopy ? PouKey() : Key();
    if (known == null) return pouCopy
      ? "Copy any POU in the c.strategy solution tree once so the helper learns your POU key, then copy again in Pathfinder"
      : "Copy any block in c.strategy once so the helper learns your project key, then copy again in Pathfinder";
    if (!Open()) return null;
    try {
      EmptyClipboard();
      int total = 0;
      for (int index = 1; index < lines.Length; index++) {
        int tab = lines[index].IndexOf('\t');
        if (tab < 0) continue;
        byte[] raw = Convert.FromBase64String(lines[index].Substring(tab + 1));
        byte[] data = pouCopy ? WithPouKey(raw, known) : WithKey(raw, known);
        foreach (string name in lines[index].Substring(0, tab).Split('|')) Put(name, data);
        total += data.Length;
      }
      return "Ready to paste (" + total + " bytes)";
    } finally {
      CloseClipboard();
    }
  }
}
'@

$Host.UI.RawUI.WindowTitle = 'Pathfinder clipboard helper'
Write-Host 'Pathfinder clipboard helper is running.'
Write-Host 'Copy blocks in Pathfinder, then paste them in c.strategy. Close this window to stop.'
if (-not [PathfinderClipboard]::Key()) { Write-Host 'First copy any block in c.strategy once, so the helper learns your project key.' }
$last = 0
while ($true) {
  $sequence = [PathfinderClipboard]::GetClipboardSequenceNumber()
  if ($sequence -ne $last) {
    try {
      $result = [PathfinderClipboard]::Process()
      if ($result) { Write-Host ('{0:HH:mm:ss}  {1}' -f (Get-Date), $result) }
    } catch {
      Write-Host ('{0:HH:mm:ss}  Could not convert: {1}' -f (Get-Date), $_.Exception.Message)
    }
    $last = [PathfinderClipboard]::GetClipboardSequenceNumber()
  }
  Start-Sleep -Milliseconds 200
}
