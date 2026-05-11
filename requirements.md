# Linkedin Post Generator

## Background

The intent of the linkedin post generator is to research a given topic over a specific timeframe and create an engaging linkedin post based off the research. To achieve this the application will use Claude AI for researching and creating the post, then use the linkedin developer API to post the content to the provided user profile.

## Expected Workflow

The application will run on a schedule via Github actions. When the schedule is triggered, the application should carry out research for the provided topic. Once research has fished, a new feature branch will be created based off the `main` called `feature/$DATE-post-title`. Relevant research should be outputted to a central location in the form of a `.md` file to allow future runs to

- pipeline is trigger via scheduled Github actions
- upon triggering, an AI workflow will carry out research for the provided topic
- once research is completed, a feature branch should be created against the repository with the name `feature/${DATE}-${POST-TITLE}`
- the AI should store research notes in a central location within the repository to allow the AI to keep context over previous posts
- post generation will be outputted as `${DATE}-${POST-TITLE}.md` files into a `posts` folder within the repository
- once post generation has been completed, the AI will create a pull request against the repository for manual review by the linkedin account holder
- a manual reviewer should be able to pull the PR to their local machine and use Claude to provide feedback to add/remove/improve post content
- once reviewed, the linkedin account holder will merge the pull request, triggering the main pipeline
- the main pipeline will take the most recent `${DATE}-${POST-TITLE}.md` post and use that to send a POST request using the linkedin developer API

## Requirements

Requirements marked as `MUST` are non-negotiable. Requirements marked as `SHOULD` are negotiable and can be skipped if libraries/API's do not support the requirement.

- MUST: store secrets in a `.env` file, i.e. API keys, password, personal information
- MUST: run in Github actions on a schedule
- MUST: store research notes in a central location within the repo
- MUST: store post content as `${DATE}-${POST-TITLE}.md` files in a central location within the repository
- MUST: create a new PR with the research notes and post content
- MUST: be able to accept feedback on the PR from a local machine
- MUST: use previous research notes as context and awareness of what has previously been posted
- MUST: only POST to linkedin when the PR is merged to main
- MUST: append a maximum of 5 relevant hashtags to every post that relate to the content, including any provided hashtags from a `.env` file if populated
- SHOULD: provide an image in the linkedin post to increase engagement
- SHOULD: be able to research engagement on previous posts to understand what content has worked well previously
- SHOULD: generate images no greater than 1200 x 627 pixels
- SHOULD: use previous posts from within the repo as a guidance for new post creation - content, style, etc.

## Skills

The following skills are required for this project:

- nodejs expert in functional programming
- github actions expert for pipeline creation
- expert linkedin API user
- content researcher

## Tooling

- latest nodejs
- docker for pipeline execution?
- `anthropic-ai/sdk` or `claude-code-js` (which ever sdk is better suited)
