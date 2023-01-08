import React from "react";
import { isValidateEmail } from "../../utils/isValidEmail";
import { useGetUserQuery } from "../../features/users/usersApi";
import Error from "../ui/Error";
import { useDispatch, useSelector } from "react-redux";

import {
  conversationsApi,
  useAddConversationMutation,
  useEditConversationMutation,
} from "../../features/conversations/conversationsApi";
import { useAddMessageMutation } from "../../features/messages/messageApi";

export default function Modal({ open, control }) {
  const { user: loggedInUser } = useSelector((state) => state.auth) || {};
  const { email: myEmail } = loggedInUser || {};
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [userChecked, setUserChecked] = React.useState(false);
  const [responseError, setResponseError] = React.useState("");
  const [conversation, setConversation] = React.useState(undefined);

  const dispatch = useDispatch();
  const { data: participant } = useGetUserQuery(email, {
    skip: !userChecked,
  });
  const [
    addConversation,
    { data: newConversation, isSuccess: isAddConversationSuccess },
  ] = useAddConversationMutation();
  const [
    editConversation,
    { data: updatedConversation, isSuccess: isEditConversationSuccess },
  ] = useEditConversationMutation();
  const [addMessage, { isSuccess: isSendMessageSuccess }] =
    useAddMessageMutation();

  React.useEffect(() => {
    if (participant?.length > 0 && myEmail !== participant[0]?.email) {
      dispatch(
        conversationsApi.endpoints.getSingleConversation.initiate({
          userEmail: myEmail,
          participantEmail: participant[0]?.email,
        })
      )
        .unwrap()
        .then((data) => {
          setConversation(data);
        })
        .catch((err) => setResponseError("There was a problem!"));
    }
  }, [participant, dispatch]);

  //listen add conversations add/edit

  React.useEffect(() => {
    control();
    setEmail("");
    setMessage("");
    setConversation(undefined);
  }, [isAddConversationSuccess, isEditConversationSuccess]);

  const debounceHandler = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  };
  const doSearch = (value) => {
    if (isValidateEmail(value)) {
      // check user API
      setEmail(value);
      setUserChecked(true);
    }
  };

  const handleSearch = debounceHandler(doSearch, 500);

  const handleClick = async (e) => {
    e.preventDefault();
    if (conversation?.length > 0) {
      //edit conversation
      const res = await editConversation({
        id: conversation[0].id,
        sender: loggedInUser,
        data: {
          participants: `${myEmail}-${participant[0].email}`,
          users: [loggedInUser, participant[0]],
          message: message,
          timestamp: new Date().getTime(),
        },
      });
    } else if (conversation?.length === 0) {
      addConversation({
        sender: loggedInUser,
        data: {
          participants: `${myEmail}-${participant[0].email}`,
          users: [loggedInUser, participant[0]],
          message: message,
          timestamp: new Date().getTime(),
        },
      });
    }
  };
  return (
    open && (
      <>
        <div
          onClick={control}
          className="fixed w-full h-full inset-0 z-10 bg-black/50 cursor-pointer"
        ></div>
        <div className="rounded w-[400px] lg:w-[600px] space-y-8 bg-white p-10 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Send message
          </h2>
          <form className="mt-8 space-y-6" onSubmit={handleClick}>
            <input type="hidden" name="remember" value="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="to" className="sr-only">
                  To
                </label>
                <input
                  onChange={(e) => handleSearch(e.target.value)}
                  id="to"
                  name="to"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm"
                  placeholder="Send to"
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  id="message"
                  name="message"
                  type="message"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm"
                  placeholder="Message"
                />
              </div>
            </div>

            <div>
              <button
                disabled={
                  conversation === undefined ||
                  (participant?.length > 0 && participant[0]?.email === myEmail)
                }
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                Send Message
              </button>
            </div>

            {participant?.length === 0 && (
              <Error message="This user does not exists" />
            )}
            {participant?.length > 0 && participant[0]?.email === myEmail && (
              <Error message="You Can't Sent Message To Yourself" />
            )}
            {responseError && <Error message={responseError} />}
          </form>
        </div>
      </>
    )
  );
}
