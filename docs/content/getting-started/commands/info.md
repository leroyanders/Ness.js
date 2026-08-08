# `ness info`

Prints environment information useful for diagnostics and bug reports.

```bash
ness info
```

The output includes the operating system, CPU, Node.js, npm, Yarn, installed Ness packages, globally installed CLI, and detected browser versions.

The top-level `--info` option is still accepted, but only alongside a command: `ness --info doctor` runs the command and then prints the report. On its own, `ness --info` prints the help text and exits `1`, so use the `info` command.
