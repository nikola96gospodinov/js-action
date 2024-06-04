const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const pr_number = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })

    const octokit = new github.getOctokit(token)

    const { data: changedFiles } = await octokit.rest.pull.listFiles({
      owner,
      repo,
      pull_number: pr_number
    })

    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0
    }

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions
      acc.deletions += file.deletions
      acc.changes += file.changes
      return acc
    }, diffData)

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `This PR has ${diffData.additions} additions, ${diffData.deletions} deletions, and ${diffData.changes} changes.`
    })

    for (const file of changedFiles) {
      const fileExtension = file.filename.split('.').pop()
      let label = ''

      switch (fileExtension) {
        case 'js':
          label = 'JavaScript'
          break
        case 'md':
          label = 'Markdown'
          break
        case 'yml':
          label = 'YAML'
          break
        default:
          label = 'other'
      }

      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      })
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
