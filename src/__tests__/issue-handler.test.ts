import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { IssueHandler } from '../features/issues/handlers/issue.handler';
import { LinearAuth } from '../auth';
import { LinearGraphQLClient } from '../graphql/client';
import { UpdateIssueStatusInput } from '../features/issues/types/issue.types';
import { LinearClient } from '@linear/sdk';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

jest.mock('../auth');
jest.mock('../graphql/client');

describe('IssueHandler', () => {
  let issueHandler: IssueHandler;
  let mockAuth: jest.Mocked<any>;
  let mockGraphQLClient: jest.Mocked<any>;
  let mockLinearClient: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLinearClient = {} as any;
    mockGraphQLClient = {
      updateIssue: jest.fn()
    } as any;
    
    mockAuth = {
      getClient: jest.fn().mockReturnValue(mockLinearClient),
      isAuthenticated: jest.fn().mockReturnValue(true),
      needsTokenRefresh: jest.fn().mockReturnValue(false)
    } as any;
    
    issueHandler = new IssueHandler(mockAuth, mockGraphQLClient);
  });

  describe('handleUpdateIssueStatus', () => {
    it('should successfully update issue status', async () => {
      const mockResponse = {
        issueUpdate: {
          success: true,
          issues: [
            {
              id: 'issue-1',
              identifier: 'TEST-1',
              title: 'Test Issue',
              url: 'https://linear.app/test/issue/TEST-1'
            }
          ]
        }
      };

      mockGraphQLClient.updateIssue.mockImplementation(() => Promise.resolve(mockResponse));

      const input: UpdateIssueStatusInput = {
        id: 'TEST-1',
        stateId: 'state-2'
      };

      const result = await issueHandler.handleUpdateIssueStatus(input);

      expect(mockGraphQLClient.updateIssue).toHaveBeenCalledWith(
        'TEST-1',
        { stateId: 'state-2' }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Successfully updated status of issue TEST-1')
          }
        ]
      });
    });

    it('should throw error when update fails', async () => {
      mockGraphQLClient.updateIssue.mockImplementation(() => Promise.resolve({
        issueUpdate: {
          success: false,
          issues: []
        }
      }));

      const input: UpdateIssueStatusInput = {
        id: 'TEST-1',
        stateId: 'state-2'
      };

      await expect(issueHandler.handleUpdateIssueStatus(input)).rejects.toThrow('Failed to update issue status');
    });

    it('should throw error for missing required parameters', async () => {
      const invalidInput = {
        id: 'TEST-1'
      } as any;

      await expect(issueHandler.handleUpdateIssueStatus(invalidInput)).rejects.toThrow('Missing required parameter');
    });
  });
});
