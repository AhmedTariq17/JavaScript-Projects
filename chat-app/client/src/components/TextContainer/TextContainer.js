import React from "react";

import onlineIcon from "../../icons/onlineIcon.png";

import "./TextContainer.css";

const TextContainer = ({ users }) => (
  <div className="textContainer">
    <div>
      <h1>
        Welcome to Chatify! <span role="img" aria-label="emoji">💬</span>
      </h1>
      <h2>
        Engage in seamless real-time communication with your team, friends, or
        anyone around the world. <span role="img" aria-label="emoji">🌎</span>
      </h2>
      <h2>
        Try it out right now! <span role="img" aria-label="emoji">⬅️</span>
      </h2>
    </div>
    {users && users.length > 0 ? (
      <div>
        <h1>People currently chatting:</h1>
        <div className="activeContainer">
          {users.map(({ name }) => (
            <div key={name} className="activeItem">
              <img alt="Online Icon" src={onlineIcon} className="onlineIcon" />
              {name}
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </div>
);

export default TextContainer;
