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
  font-size: 18px;
  font-weight: 700;
  color: #4e6174;
  margin-top: 20px;
  padding: 0;
  cursor: pointer;
  user-select: all;
  word-break: break-all;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
`;

const XLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
  text-decoration: none;
  color: inherit;
  &:hover {
    opacity: 0.85;
  }
`;

const XIcon = styled.svg`
  width: 28px;
  height: 28px;
  fill: currentColor;
  color: #0f1419;
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
            <XLink
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="safari_mixer on X"
            >
              <XIcon viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </XIcon>
            </XLink>
          </div>
        </div>
      </WelcomeContainer>
    );
  }
}

export default Welcome;
