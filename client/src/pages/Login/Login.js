import React from 'react';
import faker from 'faker';
import { Card, CardTitle, Form, FormGroup, Input, Button, Container, Row, Col } from 'reactstrap';
import PropTypes from 'prop-types';
import './style.scss';

export default class Login extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      roomCode: 'room1',
      userId: faker.name.firstName().toLocaleLowerCase(),
    };
  }

  onChange = (e) => {
    let { value } = e.target;
    value = value.replace(/[^A-z0-9]/g, '_');
    this.setState({ [e.target.name]: value });
  }

  onSubmit = (e) => {
    e.preventDefault();
    const { roomCode, userId } = this.state;
    const { history } = this.props;
    history.push(`/${roomCode}/${userId}`);
  }

  render() {
    const { roomCode, userId } = this.state;
    return (
      <div className="login-page">
        <Container>
          <Row>
            <Col sm={9} md={7} lg={5} className="mx-auto">
              <Card body>
                <CardTitle>
                  <h5 className="text-center">Đăng nhập</h5>
                </CardTitle>
                <Form onSubmit={this.onSubmit}>
                  <FormGroup>
                    <Input
                      name="roomCode"
                      value={roomCode}
                      placeholder="Phòng"
                      onChange={this.onChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Input
                      name="userId"
                      value={userId}
                      placeholder="Tên đăng nhập"
                      onChange={this.onChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Button color="primary" block disabled={!userId || !roomCode}>THAM GIA</Button>
                  </FormGroup>
                </Form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}
