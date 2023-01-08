import { useDispatch, useSelector } from "react-redux";
import {
  conversationsApi,
  useGetConversationsQuery,
} from "../../features/conversations/conversationsApi";
import ChatItem from "./ChatItem";
import Error from "../../components/ui/Error";
import moment from "moment";
import { getPartnerInfo } from "../../utils/getPartnerInfo";
import gravatarUrl from "gravatar-url";
import { Link } from "react-router-dom";
import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
export default function ChatItems() {
  const { email } = useSelector((state) => state.auth?.user) || {};
  const { isLoading, isError, data, error } = useGetConversationsQuery(email);

  const { data: conversations, totalCount } = data || {};
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const dispatch = useDispatch();

  const fetchMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  React.useEffect(() => {
    if (Number(totalCount) > 0) {
      const more =
        Math.ceil(
          Number(totalCount) /
            Number(process.env.REACT_APP_CONVERSATIONS_PER_PAGE)
        ) > page;
      setHasMore(more);
    }
  }, [totalCount, page]);

  React.useEffect(() => {
    if (page > 1) {
      dispatch(
        conversationsApi.endpoints.getMoreConversations.initiate({
          email,
          page,
        })
      );
    }
  }, [page, dispatch, email]);

  //decide what to render
  let content = null;

  if (isLoading) {
    content = <li className="m-2 text-center">Loading..</li>;
  } else if (!isLoading && isError) {
    content = (
      <li className="m-2 text-center">
        <Error message={error?.data} />
      </li>
    );
  } else if (!isLoading && !isError && conversations?.length === 0) {
    content = (
      <li className="m-2 text-center">
        <Error message="No Conversations Found." />
      </li>
    );
  } else if (!isLoading && !isError && conversations?.length > 0) {
    content = (
      <InfiniteScroll
        dataLength={conversations?.length}
        next={() => fetchMore()}
        hasMore={hasMore}
        loader={<h4>Loading..</h4>}
        height={window.innerHeight - 129}
      >
        {conversations.map((chatItem) => {
          const { users, message, timestamp, id } = chatItem;
          const { name, email: partnerEmail } = getPartnerInfo(users, email);
          return (
            <li key={id}>
              <Link to={`/inbox/${id}`}>
                <ChatItem
                  avatar={gravatarUrl(partnerEmail, { size: 80 })}
                  name={name}
                  lastMessage={message}
                  lastTime={moment(timestamp).fromNow()}
                />
              </Link>
            </li>
          );
        })}
      </InfiniteScroll>
    );
  }

  return <ul>{content}</ul>;
}
