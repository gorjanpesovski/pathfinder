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
  static readonly string KeyFile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Pathfinder", "cstrategy-key.txt");

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

  public static string Process() {
    if (!Open()) return null;
    string text = null;
    try {
      byte[] copied = ReadFormat(RegisterClipboardFormat(Blocks));
      if (copied != null) {
        string key = ReadKey(copied);
        if (!string.IsNullOrEmpty(key) && key != Key()) {
          Directory.CreateDirectory(Path.GetDirectoryName(KeyFile));
          File.WriteAllText(KeyFile, key);
          return "Learned the c.strategy project key from your copy";
        }
        return null;
      }
      if (!IsClipboardFormatAvailable(13)) return null;
      byte[] raw = ReadFormat(13);
      if (raw == null) return null;
      text = Encoding.Unicode.GetString(raw).TrimEnd('\0');
    } finally {
      CloseClipboard();
    }
    if (!text.StartsWith(Marker)) return null;
    string known = Key();
    if (known == null) return "Copy any block in c.strategy once so the helper learns your project key, then copy again in Pathfinder";
    string[] lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
    if (!Open()) return null;
    try {
      EmptyClipboard();
      int total = 0;
      for (int index = 1; index < lines.Length; index++) {
        int tab = lines[index].IndexOf('\t');
        if (tab < 0) continue;
        byte[] data = WithKey(Convert.FromBase64String(lines[index].Substring(tab + 1)), known);
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
