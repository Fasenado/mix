/* @flow */

import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.div`
  position: relative;
  @media (max-width: 600px) {
    height: 24px;
  }
`;

class Footer extends React.Component {
  render() {
    return <FooterContainer className={this.props.hide ? 'hidden' : ''} />;
  }
}

export default Footer;
