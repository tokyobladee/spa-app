import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import type { CommentItem, CommentSortField, PaginatedComments, SortDirection } from "@comments/shared";
import { CommentsApi, type CreateCommentPayload } from "../../api/commentsApi";

export interface CommentsState {
  data: PaginatedComments;
  sortBy: CommentSortField;
  direction: SortDirection;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setSortBy: (field: CommentSortField) => void;
  setDirection: (direction: SortDirection) => void;
  createComment: (payload: CreateCommentPayload) => Promise<void>;
  refresh: () => Promise<void>;
}

const emptyData: PaginatedComments = {
  items: [],
  page: 1,
  pageSize: 25,
  total: 0
};

export function useComments(): CommentsState {
  const api = useMemo(() => new CommentsApi(), []);
  const [data, setData] = useState<PaginatedComments>(emptyData);
  const [sortBy, setSortBy] = useState<CommentSortField>("createdAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await api.listComments({ page, pageSize: 25, sortBy, direction }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load comments");
    } finally {
      setLoading(false);
    }
  }, [api, direction, page, sortBy]);

  const createComment = useCallback(
    async (payload: CreateCommentPayload) => {
      setError(null);
      await api.createComment(payload);
      await refresh();
    },
    [api, refresh]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = io("/", {
      path: "/socket.io"
    });

    socket.on("comment.created", (comment: CommentItem) => {
      setData((current) => {
        if (comment.parentId) {
          return {
            ...current,
            items: current.items.map((item) =>
              item.id === comment.parentId
                ? { ...item, repliesCount: item.repliesCount + 1 }
                : item
            ),
            total: current.total
          };
        }

        return {
          ...current,
          items: [comment, ...current.items].slice(0, current.pageSize),
          total: current.total + 1
        };
      });
    });

    return () => {
      socket.close();
    };
  }, []);

  return {
    data,
    sortBy,
    direction,
    loading,
    error,
    setPage,
    setSortBy,
    setDirection,
    createComment,
    refresh
  };
}
