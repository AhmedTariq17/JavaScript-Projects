import React from "react";

import "./Input.css";

const Input = ({ message, setMessage, sendMessage }) => (
  <form className="form" onSubmit={(event) => sendMessage(event)}>
    <input
      className="input"
      type="text"
      placeholder="Type a message..."
      value={message}
      onChange={(event) => setMessage(event.target.value)}
      onKeyDown={(event) => event.key === "Enter" ? sendMessage(event) : null}
    />
    <button className="sendButton" type="submit">
      Send
    </button>
  </form>
);

export default Input;
