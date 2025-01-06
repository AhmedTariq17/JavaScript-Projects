import React, { useState, useEffect } from "react";
import queryString from "query-string";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";

import TextContainer from "../TextContainer/TextContainer";
import Messages from "../Messages/Messages";
import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";

import "./Chat.css";

const ENDPOINT = "http://localhost:5000"; // Update endpoint to match your backend server URL

let socket;

const Chat = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const location = useLocation(); // Use useLocation to get the current location object

  // Handle connection and joining the chat room
  useEffect(() => {
    const { name, room } = queryString.parse(location.search); // Parse name and room from URL

    if (!name || !room) {
      alert("Name and room are required!");
      return;
    }

    socket = io(ENDPOINT); // Connect to the backend server

    setName(name);
    setRoom(room);

    socket.emit("join", { name, room }, (error) => {
      if (error) {
        alert(error); // Display error if provided by the server
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect(); // Disconnect from the server
      socket.off(); // Remove all event listeners
    };
  }, [location.search]);

  // Listen for incoming messages and room data
  useEffect(() => {
    // Listen for 'message' event and update messages state
    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for 'roomData' event and update users state
    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });

    // Cleanup event listeners on unmount
    return () => {
      socket.off("message");
      socket.off("roomData");
    };
  }, []);

  // Handle sending a message
  const sendMessage = (event) => {
    event.preventDefault();

    if (message.trim()) {
      socket.emit("sendMessage", message, () => setMessage("")); // Send message and clear input
    }
  };

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input message={message} setMessage={setMessage} sendMessage={sendMessage} />
      </div>
      <TextContainer users={users} />
    </div>
  );
};

export default Chat;
