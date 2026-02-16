/**
 * React Starter Kit for Firebase and GraphQL
 * https://github.com/kriasoft/react-firebase-starter
 * Copyright (c) 2015-present Kriasoft | MIT License
 */

/* @flow */
import Artyom from 'artyom.js';
import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { ApiAiClient } from 'api-ai-javascript';

import Animal from './Animal';
import Dictation from './Dictation';
import Speech from './Speech';
import utils from './../../utils';

const ENTER_KEY_CODE = 13;

const WELCOME_HEAD_EXAMPLES = [
  'monkey',
  'giraffe',
  'elephant',
  'lion',
  'tiger',
  'zebra',
  'fox',
  'dog',
  'cat',
  'frog'
];

/** Client that calls our Dialogflow ES proxy (same interface as ApiAiClient.textRequest). */
function createProxyClient(detectIntentUrl) {
  const sessionId =
    'animixer-' + Math.random().toString(36).slice(2, 12);
  return {
    textRequest(text) {
      return fetch(detectIntentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, sessionId })
      }).then(r => {
        if (!r.ok) {
          return r.json().then(body => Promise.reject(new Error(body.error || r.statusText)));
        }
        return r.json();
      });
    }
  };
}

const Container = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  position: relative;
`;

const InputField = styled.div`
  border: 1px solid #587b14;
  border-radius: 34px;
  background-color: #ffffff;
  display: flex;
  padding-left: 15px;
  padding-right: 5px;
  padding-top: 2.5px;
  padding-bottom: 2.5px;
`;

const Input = styled.input`
  font-family: 'Nanum Gothic';
  font-size: 16px;
  font-weight: bold;
  padding-bottom: 10px;
  background-color: transparent;
  outline: none;
  line-height: 1.33333;
`;

const ScrollChat = styled.div`
  overflow-y: scroll;
  height: 100%;

  @media (max-width: 992px) {
    height: calc(100% - 100px);
  }

  @media (max-width: 600px) {
    height: calc(100% - 40px);
  }
`;

const InputContainer = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  bottom: 20px;
  z-index: 2;

  @media (max-width: 992px) {
    bottom: 60px;
  }

  @media (max-width: 600px) {
    bottom: 0px;
    left: 0.75rem;
    right: 0.75rem;
    margin: 10px;
  }
`;

const ChatBoxContainer = styled.div`
  height: 75%;
  position: relative;
  top: 70px;

  @media (max-width: 992px) {
    margin-bottom: 0px;
    height: 85%;
  }

  @media (max-height: 600px) {
    margin-bottom: 0px;
    height: 80%;
  }
`;

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    const client = props.detectIntentUrl
      ? createProxyClient(props.detectIntentUrl)
      : new ApiAiClient({ accessToken: this.props.accessToken });
    this.state = {
      client,
      artyom: new Artyom(),
      speak: '',
      pauseDictation: false,
      dictationEnabled: true,
      currentQuery: null,
      startChat: false,
      audioUrl: null,
      heightCss: '100vh'
    };
    this.scrollUp = this.props.scrollUp || function() {};

    // Work around 100vh not compatible with mobile devices
    if (this.state.artyom.Device.isMobile) {
      this.state.heightCss = window.innerHeight + 'px';
    }

    this.micTimeout = null;
  }

  componentDidMount() {
    this.inputField.addEventListener(
      'keydown',
      this.queryInputKeyDown.bind(this)
    );
    if (this.state.artyom.Device.isMobile) {
      window.addEventListener('resize', this.updateChatBoxSize.bind(this));
    }
  }

  componentWillUnmount() {
    this.inputField.removeEventListener(
      'keydown',
      this.queryInputKeyDown.bind(this)
    );

    if (this.state.artyom.Device.isMobile) {
      window.removeEventListener('resize', this.updateChatBoxSize.bind(this));
    }
  }

  componentWillReceiveProps(newProps) {
    if (
      newProps.startChat !== this.props.startChat &&
      newProps.startChat &&
      !this.state.startChat
    ) {
      this.startChat();
    } else if (
      newProps.startChat !== this.props.startChat &&
      !newProps.startChat &&
      this.state.startChat
    ) {
      this.stopChat();
    }
  }

  updateChatBoxSize() {
    this.setState({
      heightCss: window.innerHeight + 'px'
    });
  }

  queryInputKeyDown(event) {
    if (event.which !== ENTER_KEY_CODE) {
      return;
    }

    let value = this.inputField.value;
    this.inputField.value = '';
    if (value) {
      this.userInput(value);
    }
  }

  userInput(value) {
    console.log('User input:', value);
    if (this.state.currentQuery) {
      this.updateNode(this.state.currentQuery, value);
    } else {
      this.createQueryNode(value);
    }
    this.setState({
      currentQuery: null
    });

    // Only send alphabetic response to the bot
    let userValue = value.replace(/[^A-Za-z]/g, '');

    if (userValue) {
      return this.getResponse(value);
    }
  }

  sendText(text) {
    return this.state.client.textRequest(text);
  }

  getResponse(value) {
    let responseNode = this.createResponseNode();

    return this.sendText(value)
      .then(response => {
        let result;
        try {
          if (
            response.result &&
            response.result.fulfillment &&
            response.result.fulfillment.data !== undefined &&
            response.result.fulfillment.data.google &&
            response.result.fulfillment.data.google.rich_response
          ) {
            result = response.result.fulfillment.data.google.rich_response;
          } else if (response.result && response.result.fulfillment) {
            result = response.result.fulfillment.speech;
          }
          if (result === undefined || result === null || result === '') {
            result = "Something went wrong (empty response). Check console.";
          }
        } catch (error) {
          result = "Couldn't parse response. Check console.";
        }
        this.setResponseOnNode(result, responseNode);
        let part = response.result && response.result.suggestedPart;
        if (!part && typeof result === 'string') {
          const s = (result || '').toLowerCase();
          if (s.includes('body would you like') || s.includes('what body')) part = 'body';
          else if (s.includes('legs') && (s.includes('would you like') || s.includes('pick'))) part = 'legs';
        }
        if (part) {
          this.appendChoiceChips(responseNode, part);
        }
        if (response.result && response.result.action === 'exit') {
          this.setState({
            dictationEnabled: false
          });
          this.micTimeoutFn(false);
        } else {
          this.micTimeoutFn(true);
        }
      })
      .catch(
        function(err) {
          console.error('Chat API error:', err);
          const message =
            err && (err.message || err.toString)
              ? (err.message || err.toString())
              : 'Something went wrong';
          this.setResponseOnNode(
            `Something went wrong: ${message}. (Check console for details. For local dev you may need your own Dialogflow client token.)`,
            responseNode
          );
        }.bind(this)
      );
  }

  micTimeoutFn(restart) {
    if (this.micTimeout) {
      clearTimeout(this.micTimeout);
      this.micTimeout = null;
    }
    // No auto "bye" — just wait for the user to reply
  }

  createQueryNode(query) {
    let node = document.createElement('div');
    node.className =
      'query clearfix left-align right white-text card-panel bring-front margins';
    node.innerHTML = query;
    if (this.resultDiv) {
      this.resultDiv.appendChild(node);
      this.updateScroll();
    }
    return node;
  }

  createResponseNode() {
    let node = document.createElement('div');
    node.className =
      'response clearfix left-align left card-panel text-darken-2 hoverable bring-front margins';
    node.innerHTML = '...';
    if (this.resultDiv) {
      this.resultDiv.appendChild(node);
      this.updateScroll();
    }
    return node;
  }

  updateNode(node, text) {
    node.innerHTML = text;
    if (this.state.currentQuery === node) {
      this.setState({ currentQuery: null });
    }
    return node;
  }

  addImage(imageData, node) {
    let imageNode = document.createElement('div');
    let image = document.createElement('img');
    let title = document.createElement('h3');

    imageNode.className += 'container';
    title.innerHTML = imageData.basic_card.title;
    image.className += 'image-size';
    image.src = imageData.basic_card.image.url;
    if (imageData.basic_card.image.accessibility_text) {
      image.alt = imageData.basic_card.image.accessibility_text;
    }
    image.addEventListener('load', this.updateScroll.bind(this));

    imageNode.appendChild(title);
    imageNode.appendChild(image);
    node.appendChild(imageNode);
  }

  addAnimal(cardData, node) {
    let shareUrl;
    let animalUrl;
    if (cardData.basic_card.buttons.length > 0) {
      shareUrl = cardData.basic_card.buttons[0].open_url_action.url;
      const query = shareUrl.indexOf('?') >= 0 ? shareUrl.substring(shareUrl.indexOf('?')) : '';
      animalUrl = '/animal' + query;
    }
    let animalNode = document.createElement('div');
    let animalData = {
      name: cardData.basic_card.title,
      prettyName: cardData.basic_card.title,
      imageUrl: cardData.basic_card.image.url,
      audioUrl: this.state.audioUrl,
      shareUrl: shareUrl,
      animalUrl: animalUrl
    };
    node.appendChild(animalNode);
    ReactDOM.render(
      <Animal
        shareEnabled={true}
        titleEnabled={true}
        isInChat={true}
        animalData={animalData}
        onLoad={this.updateScroll.bind(this)}
      />,
      animalNode
    );
  }

  addTextAudio(textData, node) {
    let speech =
      textData.simple_response.ssml || textData.simple_response.text_to_speech;
    let text = document.createElement('p');
    let audioContent = /<audio(.*?)<\/audio>/g.exec(speech);
    let outputText = /<speak>(.*?)<\/speak>/g.exec(speech)[1];

    if (audioContent) {
      for (let i = 1; i < audioContent.length; i++) {
        outputText = outputText.replace(audioContent[i], '');
      }
      if (audioContent) {
        let audioSrc = /src="(.*?)"/g.exec(audioContent[1])[1];
        this.setState({ audioUrl: audioSrc });
      }
    }

    text.innerHTML = outputText;
    node.appendChild(text);

    this.setState({ speak: speech });
  }

  setResponseOnNode(response, node) {
    if (typeof response === 'object') {
      node.innerHTML = '';

      for (let i = 0; i < response.items.length; i++) {
        let item = response.items[i];
        if (item.basic_card !== undefined) {
          this.addAnimal(item, node);
        } else if (item.simple_response !== undefined) {
          this.addTextAudio(item, node);
        }
      }
    } else {
      node.innerHTML = response ? response : '[empty response]';
      this.setState({ speak: response });
    }
    node.setAttribute('data-actual-response', response);
    this.updateScroll();
  }

  updateScroll() {
    if (this.scrollDiv) {
      this.scrollDiv.scrollTop = this.scrollDiv.scrollHeight;
    }
  }

  awaitingInput() {
    if (!this.state.currentQuery) {
      let node = this.createQueryNode('...');
      this.setState({ currentQuery: node });
    }
  }

  pauseDictation(pause) {
    this.setState({ pauseDictation: pause });
  }

  appendChoiceChips(node, part) {
    const label = part === 'head' ? 'Head' : part === 'body' ? 'Body' : 'Legs';
    const examplesHtml = WELCOME_HEAD_EXAMPLES.map(
      a =>
        `<span class="choice-chip" data-value="${a} ${part}" style="display:inline-block;margin:4px 6px 4px 0;padding:6px 12px;background:#587b14;color:#fff;border-radius:20px;cursor:pointer;font-size:14px;">${a.charAt(0).toUpperCase() + a.slice(1)} ${label}</span>`
    ).join('');
    const wrap = document.createElement('div');
    wrap.style.marginTop = '10px';
    wrap.innerHTML = '<p style="margin:0 0 6px 0;font-size:13px;color:#666;">Type in Chat Or pick one:</p><div style="margin-top:6px;">' + examplesHtml + '</div>';
    node.appendChild(wrap);
    wrap.querySelectorAll('.choice-chip').forEach(el => {
      el.addEventListener('click', () => {
        this.userInput(el.getAttribute('data-value'));
      });
    });
    this.updateScroll();
  }

  showWelcomeMessage() {
    const node = this.createResponseNode();
    const examplesHtml = WELCOME_HEAD_EXAMPLES.map(
      a =>
        `<span class="welcome-example" data-value="${a} head" style="display:inline-block;margin:4px 6px 4px 0;padding:6px 12px;background:#587b14;color:#fff;border-radius:20px;cursor:pointer;font-size:14px;">${a.charAt(0).toUpperCase() + a.slice(1)} Head</span>`
    ).join('');
    node.innerHTML =
      '<p style="margin:0 0 12px 0;font-weight:bold;">Safari Mixer — animal mixer: create viral combos and new memes and deploy them on Pump Fun.</p>' +
      '<p style="margin:0 0 8px 0;">What head would you like?</p>' +
      '<p style="margin:0 0 6px 0;font-size:13px;color:#666;">Example:</p>' +
      '<p style="margin:0 0 8px 0;">Monkey Head</p>' +
      '<p style="margin:0 0 4px 0;font-size:13px;color:#666;">Type in Chat Or pick one:</p>' +
      '<div style="margin-top:8px;">' +
      examplesHtml +
      '</div>';
    node.querySelectorAll('.welcome-example').forEach(el => {
      el.addEventListener('click', () => {
        this.userInput(el.getAttribute('data-value'));
      });
    });
    this.updateScroll();
  }

  startChat() {
    this.showWelcomeMessage();
    this.setState({
      startChat: true,
      dictationEnabled: true
    });
  }

  stopChat() {
    this.setState({
      startChat: false,
      dictationEnabled: false
    });
    setTimeout(() => {
      this.resultDiv.innerHTML = '';
    }, 500);
    this.micTimeoutFn(false);
  }

  render() {
    return (
      <Container
        innerRef={ele => (this.chatDiv = ele)}
        style={{ height: this.state.heightCss }}
        className={
          this.state.startChat ? 'container fadein' : 'container fadeout'
        }
      >
        <ChatBoxContainer className="row">
          <ScrollChat
            className="col s12"
            innerRef={ele => (this.scrollDiv = ele)}
          >
            <div ref={ele => (this.resultDiv = ele)} id="result" />
          </ScrollChat>
        </ChatBoxContainer>
        <InputContainer className="row">
          <div className="col s12">
            <InputField>
              <div style={{ width: '100%' }}>
                <Input
                  innerRef={ele => (this.inputField = ele)}
                  placeholder="Type to explore..."
                  id="q"
                  type="text"
                  style={{
                    marginBottom: '0px',
                    borderBottom: 'none',
                    marginLeft: '5px',
                    outlineStyle: 'none',
                    boxShadow: 'none',
                    borderColor: 'transparent'
                  }}
                />
              </div>
              <div
                className="col l2 m4 s6 valign-wrapper"
                style={{ paddingRight: '0px' }}
              >
                <div style={{ marginLeft: 'auto', marginRight: '5px' }}>
                  <Dictation
                    artyom={this.state.artyom}
                    userInput={this.userInput.bind(this)}
                    awaitingInput={this.awaitingInput.bind(this)}
                    recordPause={this.state.pauseDictation}
                    enabled={this.state.dictationEnabled}
                  />
                </div>
                <Speech
                  artyom={this.state.artyom}
                  text={this.state.speak}
                  speakingCallback={this.pauseDictation.bind(this)}
                  enabled={true}
                />
              </div>
            </InputField>
          </div>
        </InputContainer>
      </Container>
    );
  }
}

export default ChatBox;
