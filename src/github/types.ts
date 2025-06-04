export type Label = {
  name: string;
  color?: string;
  description?: string;
};

export type CreateLabelParams = {
  label: Label;
  repositoryId: string;
};

export type CreateLabelsParams = {
  labels: Label[];
  repositoryId: string;
};

export type Issue = {
  title: string;
  body: string;
  parentIssueId?: string;
  state?: "OPEN" | "CLOSED";
  number?: number;
};

export type ProjectInfo = {
  projectId: string;
  projectNumber: number;
  fieldId: string;
  optionId: string;
};

export type CreateIssueParams = {
  issue: Issue;
  labelId: string;
  projectInfo: ProjectInfo;
  repositoryId: string;
  owner: string;
  repo: string;
};

export type CreateStoryParams = {
  story: Issue;
};

export type AddToProjectParams = {
  issueId: string;
  projectInfo: ProjectInfo;
};

export type GetProjectIdParams = {
  owner: string;
  repo: string;
};

export type CreateLabelMutationResponse = {
  createLabel: {
    label: {
      id: string;
      name: string;
      color: string;
      description: string;
    };
  };
};

export type CreateIssueMutationResponse = {
  createIssue: {
    issue: {
      id: string;
      number: number;
    };
  };
};

export type GetProjectQueryResponse = {
  repository: {
    projectsV2: {
      nodes: Array<{
        id: string;
        title: string;
        number: number;
        views: {
          nodes: Array<{
            layout: string;
          }>;
        };
        fields: {
          nodes: Array<{
            id: string;
            name: string;
            dataType: string;
            options?: Array<{
              id: string;
              name: string;
            }>;
          }>;
        };
      }>;
    };
  };
};

export type AddToProjectMutationResponse = {
  addProjectV2ItemById: {
    item: {
      id: string;
    };
  };
};

export type GetRepositoryIdQueryResponse = {
  repository: {
    id: string;
  };
};

export type GetLabelQueryResponse = {
  node: {
    label: {
      id: string;
      name: string;
      color: string;
      description: string;
    } | null;
  };
};

export type SearchIssueQueryResponse = {
  search: {
    nodes: Array<{
      id: string;
      number: number;
      title: string;
      body: string;
      labels: {
        nodes: Array<{
          id: string;
          name: string;
        }>;
      };
      parent: {
        id: string;
      } | null;
    }>;
  };
};

export type CheckProjectMembershipQueryResponse = {
  node: {
    items: {
      nodes: Array<{
        id: string;
        content: {
          id: string;
          number: number;
        };
      }>;
    };
  };
};
