# FlameWolf

Flamewolf is a Browser that's aimed to be crazy enough to not be boring. It's a privacy-focused browser based on Firefox.

## Building

You can install FlameWolf easily, by using Mozilla's `mach` Build Tool. It's already in this repo.

### Unix-like Systems (Linux/macOS)

In Linux or other Unix-like systems, you can use `mach`:

```sh
./mach build
```

### Windows

In Windows, you can use `mach.ps1` (requires PowerShell):

But first, you'll need to allow PowerShell to run scripts:

```ps1
Set-ExecutionPolicy RemoteSigned
```

Then, run it:

```ps1
.\mach.ps1 build
```
