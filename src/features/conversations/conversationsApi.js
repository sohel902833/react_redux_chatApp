import { apiSlice } from "../api/apiSlice";
import { messageApi } from "../messages/messageApi";
import io from "socket.io-client";
export const conversationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    //end points
    getConversations: builder.query({
      query: (email) =>
        `/conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_CONVERSATIONS_PER_PAGE}`,
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
          socket.on("conversation", ({ data }) => {
            updateCachedData((draft) => {
              const conversation = draft.data.find((c) => c.id == data.id);
              if (conversation?.id) {
                conversation.message = data.message;
                conversation.timestamp = data.timestamp;
              } else {
                //do something
                //check data is for logged in user or not
                const isMyConversation = data?.users?.find(
                  (user) => user?.email === arg
                );
                if (isMyConversation) {
                  draft.data.unshift(data);
                }
              }
            });
          });

          await cacheEntryRemoved;
          socket.close();
        } catch (err) {}
      },
    }),
    getMoreConversations: builder.query({
      query: ({ email, page }) =>
        `/conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_CONVERSATIONS_PER_PAGE}`,
      async onQueryStarted({ email }, { queryFulfilled, dispatch }) {
        try {
          const conversations = await queryFulfilled;
          if (conversations?.data?.length > 0) {
            dispatch(
              apiSlice.util.updateQueryData(
                "getConversations",
                email,
                (draft) => {
                  return {
                    ...draft,
                    data: [...draft.data, ...conversations.data],
                  };
                }
              )
            );
          }
        } catch (err) {}
      },
    }),
    getSingleConversation: builder.query({
      query: ({ userEmail, participantEmail }) =>
        `/conversations?participants_like=${userEmail}-${participantEmail}&participants_like=${participantEmail}-${userEmail}`,
    }),
    addConversation: builder.mutation({
      query: ({ sender, data }) => ({
        url: `/conversations`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        //i ignore optimistic cache update cause it is covered by socket

        //optimistic cache update start to the conversation cache
        // const pathResult1 = dispatch(
        //   apiSlice.util.updateQueryData(
        //     "getConversations",
        //     arg?.sender?.email,
        //     (draft) => {
        //       draft.data.push({ id: new Date().getTime(), ...arg.data });
        //     }
        //   )
        // );
        //optimistic cache update end to the conversation cache

        try {
          const conversation = await queryFulfilled;

          if (conversation?.data?.id) {
            //silent entry to message table
            const res = await dispatch(
              messageApi.endpoints.addMessage.initiate({
                conversationId: conversation?.data?.id,
                sender: arg?.sender,
                receiver:
                  arg?.data?.users[0]?.email === arg?.sender?.email
                    ? arg?.data?.users[1]
                    : arg?.data?.users[0],
                message: arg?.message,
                timestamp: arg?.timestamp,
              })
            ).unwrap();

            //update messages cache pessimistically start
            // dispatch(
            //   apiSlice.util.updateQueryData(
            //     "getMessages",
            //     res?.conversationId.toString(),
            //     (draft) => {
            //       draft.push(res);
            //     }
            //   )
            // );
            //update messages cache pessimistically end
          }
        } catch (err) {
          // pathResult1.undo();
        }
      },
    }),
    editConversation: builder.mutation({
      query: ({ id, sender, data }) => ({
        url: `/conversations/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        //optimistic cache update start to the conversation cache
        const pathResult1 = dispatch(
          apiSlice.util.updateQueryData(
            "getConversations",
            arg?.sender?.email,
            (draft) => {
              const draftConversation = draft?.data?.find(
                (c) => c.id == arg?.id
              );
              draftConversation.message = arg?.data?.message;
              draftConversation.timestamp = arg?.data?.timestamp;
            }
          )
        );
        //optimistic cache update end to the conversation cache
        try {
          const conversation = await queryFulfilled;
          if (conversation?.data?.id) {
            const requestBody = {
              conversationId: conversation?.data?.id,
              sender: arg?.sender,
              receiver:
                arg?.data?.users[0]?.email === arg?.sender?.email
                  ? arg?.data?.users[1]
                  : arg?.data?.users[0],
              message: arg?.data?.message,
              timestamp: arg?.data?.timestamp,
            };
            const res = await dispatch(
              messageApi.endpoints.addMessage.initiate(requestBody)
            ).unwrap();
            //update messages cache pessimistically start
            // dispatch(
            //   apiSlice.util.updateQueryData(
            //     "getMessages",
            //     res?.conversationId.toString(),
            //     (draft) => {
            //       draft.push(res);
            //     }
            //   )
            // );
            //update messages cache pessimistically end
          }
        } catch (err) {
          pathResult1.undo();
        }
      },
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetSingleConversationQuery,
  useAddConversationMutation,
  useEditConversationMutation,
  useGetMoreConversationsQuery,
} = conversationsApi;
