import React from 'react';
import styled from 'styled-components';

const WelcomeContainer = styled.div`
  height: 100vh;
  width: 100vw;
`;

const Start = styled.div`
  background-color: #517363;
  background-image: url('/static/img/waves.png');
  background-size: cover;
  height: 59px;
  width: 325px;
  margin: auto;
  border-radius: 30px;
  cursor: pointer;

  @media (max-width: 600px) {
    width: 250px;
    height: 45px;
  }
`;

const StartText = styled.span`
  font-family: 'Nanum Gothic';
  font-size: 16px;
  line-height: 19px;
  color: #ecf2dc;
  margin-right: auto;
  width: 252px;
`;

const MicIcon = styled.i`
  color: #ecf2dc;
  margin-left: auto;
`;

const Logo = styled.img`
  width: 100%;
  margin: auto;

  @media (max-width: 600px) {
    width: 250px;
  }
`;

const CopyableText = styled.div`
  font-family: 'Nanum Gothic', monospace;
  font-size: 12px;
  color: #4e6174;
  margin-top: 20px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  user-select: all;
  word-break: break-all;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
  &:hover {
    background: #eee;
  }
`;

const XLink = styled.a`
  display: inline-block;
  margin-top: 10px;
  font-family: 'Nanum Gothic';
  font-size: 14px;
  color: #517363;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const PUMP_ADDRESS = 'GPQUKSKqSTGEqrYGxgEaHQ7Q1mAKw6EoCJ3eHjYEpump';
const X_URL = 'https://x.com/safari_mixer';

class Welcome extends React.Component {
  constructor(props) {
    super(props);
    this.scrollDown = this.props.scrollDown || function() {};
  }

  copyAddress = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(PUMP_ADDRESS);
    } else {
      const el = document.createElement('textarea');
      el.value = PUMP_ADDRESS;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  render() {
    return (
      <WelcomeContainer
        className="row valign-wrapper"
        style={{ marginBottom: '0px' }}
      >
        <div className="col s10 offset-s1 m6 offset-m3 l4 offset-l4 center-align">
          <Logo
            className="center-align"
            src="/static/img/safari_mixer_logo.png"
          />
          <Start
            innerRef={ele => (this.startDiv = ele)}
            onClick={this.scrollDown}
            className="valign-wrapper"
          >
            <MicIcon className="small material-icons">mic_none</MicIcon>
            <StartText className="center-align">START YOUR SAFARI</StartText>
          </Start>
          <CopyableText onClick={this.copyAddress} title="Click to copy">
            {PUMP_ADDRESS}
          </CopyableText>
          <div>
            <XLink href={X_URL} target="_blank" rel="noopener noreferrer">
              x.com/safari_mixer
            </XLink>
          </div>
        </div>
      </WelcomeContainer>
    );
  }
}

export default Welcome;
