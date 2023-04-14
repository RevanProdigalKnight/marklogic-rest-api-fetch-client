# Contributing to the MarkLogic REST API fetch client

I welcome new contributors. This document will guide you through the process.

## Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by submitting an issue to our [issue tracker](https://github.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/issues). Even better, you can submit a Pull Request to fix the issue you filed.

## Want a Feature?

You can request a new feature by submitting an issue to our [issue tracker](https://github.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/issues). If you would like to implement a new feature, please create a new issue first and discuss it with one of our project maintainers.

## Submission Guidelines

### Submitting an Issue

If your issue appears to be a bug, and hasn't been reported, open a new issue. Providing the following information will increase the chances of your issue being dealt with quickly:

| Field                 | Description                                                                                                                                                             |
|:--------------------- |:----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview of the Issue | If an error is being thrown, a stack trace helps                                                                                                                        |
| Motivation/Use Case   | Explain why this is a bug                                                                                                                                               |
| Environment           | What version of [MarkLogic Server](https://docs.marklogic.com/xdmp.version) and the client are you using? What runtime (Chrome/Firefox/Edge/Deno) are you seeing it in? |
| Suggest a Fix         | If you can't fix this yourself, try to suggest what may be causing the problem                                                                                          |

### Submitting a Pull Request

A pull request is the standard way to submit changes to a repository to which you don't have commit privileges. GitHub provides a nice UI for viewing, discussing, and merging pull requests.

#### Fork the MarkLogic REST API fetch client

[Fork the project](https://github.com/RevanProdigalKnight/marklogic-rest-api-fetch-client/fork) and clone your copy.

```sh
git clone git@github.com:username/marklogic-rest-api-fetch-client.git
cd marklogic-rest-api-fetch-client
```

#### Create a branch for your changes

Check out `develop`. If you're fixing a bug, create a `bugfix/` branch; if you're adding a new feature, create a `feature/` branch.

```sh
git checkout -b <your_branch_name> -t origin/develop
```

Please make the branch name after `bugfix/` or `feature/` descriptive of what the branch is intended to do.

#### Commit your changes

Writing good commit messages is important. A commit message should describe what was changed and why. Please try to follow these guidelines when writing one:

1. The first line should be no more than 50 characters, and contain a short description of what changed
1. Keep the second line blank
1. Further lines should be no more than 72 characters

An example commit message following these guidelines may look like this:

```txt
Adds basic/digest authorization handling to client

- Also tests authorization handling against an actual MarkLogic instance
- Fixes client insertion of single documents
```

The header line should be meaningful, since that's all other people see when they run `git shortlog` or `git log --oneline`.

#### Rebase your branch

Use `git rebase` (not `git merge`) fairly often in order to make sure your branch doesn't stray too far from active development.

```sh
git fetch origin
git rebase origin/develop
```

#### Test your changes

Be sure to run unit tests before submitting your pull request. PRs with failing unit tests won't be accepted. Keep in mind that unit tests require a running MarkLogic Server instance (docker containers are fine).

```sh
deno task test
```

#### Push your changes

```sh
git push origin <your_branch_name>
```

#### Submit a pull request

Go to your fork (i.e. <https://github.com/username/marklogic-rest-api-fetch-client>) and select your feature branch. Click the "Pull Request" button and fill out the form.

Pull requests are usually reviewed within a few days. If you get comments that need to be addressed, apply your changes in a new commit and push that to your feature branch. If you want your changes to be re-reviewed in a timely manner, post a new comment to the Pull Request.

That's it. Thanks in advance for your contribution.

#### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull changes from the main repository

```sh
# Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows
git push origin --delete <your_branch_name>
# Check out the latest from develop
git checkout develop -f
# Delete the local branch
git branch -D <your_branch_name>
# Update your local develop with the latest from origin
git pull --ff origin develop
```
