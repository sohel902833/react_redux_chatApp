import { apiSlice } from "../api/apiSlice";
import io from "socket.io-client";
export const messageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    //end points
    getMessages: builder.query({
      query: (id) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      transformResponse(apiResponse, meta) {
        const totalCount = meta.response.headers.get("X-Total-Count");
        return {
          data: apiResponse,
          totalCount,
        };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        //create socket listener
        const socket = io(process.env.REACT_APP_API_URL, {
          reconnectionDelay: 1000,
          reconnection: true,
          reconnectionAttemps: 10,
          transports: ["websocket"],
          agent: false,
          upgrade: false,
          rejectUnauthorized: false,
        });
        try {
          await cacheDataLoaded;
          socket.on("message", ({ data }) => {
            updateCachedData((draft) => {
              if (data?.conversationId == arg) {
                draft?.data?.unshift(data);
              }
            });
          });

          await cacheEntryRemoved;
          socket.close();
        } catch (err) {}
      },
    }),
    getMoreMessages: builder.query({
      query: ({ id, page }) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      async onQueryStarted({ id }, { queryFulfilled, dispatch }) {
        try {
          const messages = await queryFulfilled;
          if (messages?.data?.length > 0) {
            dispatch(
              apiSlice.util.updateQueryData("getMessages", id, (draft) => {
                return {
                  ...draft,
                  data: [...draft.data, ...messages.data],
                };
              })
            );
          }
        } catch (err) {}
      },
    }),
    addMessage: builder.mutation({
      query: (data) => {
        return {
          url: `/messages`,
          method: "POST",
          body: data,
        };
      },
    }),
  }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messageApi;
