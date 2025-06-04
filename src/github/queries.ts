export const GET_REPO_ID_QUERY = `
  query GetRepoId($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
    }
  }
`;

export const GET_PROJECT_QUERY = `
  query GetProject($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      projectsV2(first: 1) {
        nodes {
          id
          title
          number
          views(first: 1) {
            nodes {
              ... on ProjectV2View {
                layout
              }
            }
          }
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_LABEL_QUERY = `
  query GetLabel($repoId: ID!, $name: String!) {
    node(id: $repoId) {
      ... on Repository {
        label(name: $name) {
          id
          name
          color
          description
        }
      }
    }
  }
`;

export const SEARCH_ISSUE_QUERY = `
  query SearchIssue($searchQuery: String!) {
    search(query: $searchQuery, type: ISSUE, first: 1) {
      nodes {
        ... on Issue {
          id
          number
          title
          body
          state
          labels(first: 10) {
            nodes {
              id
              name
            }
          }
          parent {
            id
          }
        }
      }
    }
  }
`;

export const CHECK_PROJECT_MEMBERSHIP_QUERY = `
  query CheckProjectMembership($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue {
                id
                number
              }
            }
          }
        }
      }
    }
  }
`;

export const FETCH_ALL_ISSUES_QUERY = `
  query ($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      issues(first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          state
        }
      }
    }
  }
`;
