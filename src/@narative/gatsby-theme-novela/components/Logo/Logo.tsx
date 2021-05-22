import React from "react";
import styled from "@emotion/styled";
import logo from "./logo.webp";
import mediaqueries from "@styles/media";

import { Icon } from "@types";

const Logo: Icon = ({ fill = "white" }) => {
  return (
    <LogoContainer>
      <img className="Logo__Desktop" src={logo} alt="logo" width="192" height="192"></img>
      <img className="Logo__Mobile" src={logo} alt="logo" width="23" height="23"></img>
    </LogoContainer>
  );
};

export default Logo;

const LogoContainer = styled.div`
  .Logo__Mobile {
    display: none;
  }
  ${mediaqueries.tablet`
    .Logo__Desktop {
      display: none;
    }
    
    .Logo__Mobile{
      display: block;
    }
  `}
`;
