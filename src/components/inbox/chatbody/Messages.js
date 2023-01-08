import { useDispatch, useSelector } from "react-redux";
import Message from "./Message";
import InfiniteScroll from "react-infinite-scroll-component";
import React from "react";
import { messageApi } from "../../../features/messages/messageApi";
export default function Messages({ messages = [], totalCount, id }) {
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const fetchMore = () => {
    console.log("Hello Fecing More Message");
    setPage((prevPage) => prevPage + 1);
  };

  React.useEffect(() => {
    if (Number(totalCount) > 0) {
      const more =
        Math.ceil(
          Number(totalCount) / Number(process.env.REACT_APP_MESSAGES_PER_PAGE)
        ) > page;
      setHasMore(more);
    }
  }, [totalCount, page]);

  React.useEffect(() => {
    if (page > 1) {
      // fetch more messages here
      dispatch(messageApi.endpoints.getMoreMessages.initiate({ page, id }));
    }
  }, [page]);
  console.log({ hasMore, page });

  return (
    <div
      id="messageContainer"
      className="relative w-full h-[calc(100vh_-_197px)] p-6 overflow-y-auto flex flex-col-reverse"
    >
      <ul className="space-y-2">
        <InfiniteScroll
          dataLength={messages?.length}
          next={() => fetchMore()}
          style={{ display: "flex", flexDirection: "column-reverse" }} //To put endMessage and loader to the top.
          inverse={true} //
          hasMore={hasMore}
          loader={<h4>Loading...</h4>}
          scrollableTarget="messageContainer"
        >
          {messages
            ?.slice()
            // ?.sort((a, b) => a.timestamp - b.timestamp)
            ?.map((messageItem) => {
              const { id, message, sender } = messageItem || {};
              const justify = sender?.email !== email ? "start" : "end";
              return <Message key={id} justify={justify} message={message} />;
            })}
        </InfiniteScroll>
      </ul>
    </div>
  );
}
