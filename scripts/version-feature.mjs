// @ts-check
import { simpleGit } from 'simple-git';
import { log } from 'node:console';
import { execSync } from 'node:child_process';

const git = simpleGit();

function execCommand(command) {
  log(command);
  execSync(command, { stdio: 'inherit' });
}

async function publishFeatureVersion() {
  const chalk = (await import('chalk')).default;

  const { current: branch, all: allBranch } = await git.branch();
  if (branch === 'master') {
    return log(chalk.yellow('current branch is master.'));
  }

  execSync('git pull --rebase');

  const publishBranch = `${branch}-publish`;

  if (
    allBranch.includes(publishBranch) ||
    allBranch.includes(`remotes/origin/${publishBranch}`)
  ) {
    execCommand(`git checkout ${publishBranch}`);
  } else {
    execCommand(`git checkout -b ${publishBranch}`);
  }
  if (allBranch.includes(`remotes/origin/${publishBranch}`)) {
    execCommand(`git push origin ${publishBranch}`);
  } else {
    execCommand(`git push --set-upstream origin ${publishBranch}`);
  }
  execCommand('pnpm release');
  execCommand(`git push origin --delete ${publishBranch}`);
  execCommand(`git checkout ${branch}`);
  execCommand(`git branch -D ${publishBranch}`);
}

publishFeatureVersion();
