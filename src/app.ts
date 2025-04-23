import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Exercise from './pages/Exercise';
import Navigation from './components/Navigation';
import './styles/main.css';

const App: React.FC = () => {
    return (
        <Router>
            <div>
                <Navigation />
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/exercise" component={Exercise} />
                </Switch>
            </div>
        </Router>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));