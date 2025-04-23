import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div>
            <h1>ようこそ！</h1>
            <p>このウェブサイトでは、さまざまな問題演習を行うことができます。</p>
            <nav>
                <ul>
                    <li>
                        <Link to="/exercises">問題演習に進む</Link>
                    </li>
                    <li>
                        <Link to="/about">このサイトについて</Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Home;