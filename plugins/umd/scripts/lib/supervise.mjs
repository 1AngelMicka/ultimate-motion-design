#!/usr/bin/env node
// Run one shell command with a deadline, and on timeout kill the whole process tree, not only the shell.
// `spawnSync(..., { timeout })` kills the shell alone: a render or an encoder it started keeps running.
//   node supervise.mjs <timeout-ms> <command>
// Streams the command's stdout and stderr through, exits with its code, or 124 after a timeout.
import { spawn, spawnSync } from "node:child_process";

const [ms, command] = [Number(process.argv[2]), process.argv[3]];
const win = process.platform === "win32";
// POSIX: a new process group, so one signal reaches every descendant; Windows: taskkill /T walks the tree
const child = spawn(command, { shell: true, stdio: ["ignore", "pipe", "pipe"], detached: !win, windowsHide: true });
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

let timedOut = false;
const killTree = () => {
  if (win) spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  else { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already gone */ } setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* gone */ } }, 3000).unref(); }
};
const timer = ms > 0 ? setTimeout(() => { timedOut = true; process.stderr.write(`\numd: timed out after ${Math.round(ms / 1000)} s, process tree killed\n`); killTree(); }, ms) : null;

child.on("error", (e) => { process.stderr.write(`umd: ${e.message}\n`); process.exitCode = 127; });
child.on("close", (code) => {
  if (timer) clearTimeout(timer);
  process.exitCode = timedOut ? 124 : code ?? 1;
});
