// import Blank from "./Blank";
import { useParams } from "react-router-dom";
import { useGetMessagesQuery } from "../../../features/messages/messageApi";
import Error from "../../ui/Error";
import ChatHead from "./ChatHead";
import Messages from "./Messages";
import Options from "./Options";

export default function ChatBody() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useGetMessagesQuery(id);
  const { data: messages, totalCount } = data || {};
  //decide what to render
  let content = null;
  if (isLoading) {
    content = <div>Loading...</div>;
  } else if (!isLoading && isError) {
    content = (
      <div>
        <Error message={error?.data} />
      </div>
    );
  } else if (!isLoading && !isError && messages?.length === 0) {
    content = (
      <div className="p-4">
        <Error message="No Messages Found" />
      </div>
    );
  } else if (!isLoading && !isError && messages?.length > 0) {
    content = (
      <>
        <ChatHead
          avatar="https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383__340.jpg"
          name="Akash Ahmed"
          message={messages[0]}
        />
        <Messages messages={messages} totalCount={totalCount} id={id} />
        <Options info={messages[0]} conversationId={id} />
      </>
    );
  }

  return (
    <div className="w-full lg:col-span-2 lg:block">
      <div className="w-full grid conversation-row-grid">
        {content}
        {/* <Blank /> */}
      </div>
    </div>
  );
}
