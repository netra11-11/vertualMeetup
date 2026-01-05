import React from 'react';
import '../App.css';

export default function LandingPage() {
    return (
        <div className='landingContainer'>
           <nav>
              <div className='navHeader'>
                <h3>VertualMeetup</h3>
              </div>
              <div className='navList'>
                <p>join as guest</p>
                <p>Resister</p>
                <div role='button'>
                    <p> Log in</p>
                    </div>
              </div>
           </nav>
           <div className="landingMainContainer">
                   <div>
                   <h3> <span style={{color:"orange"}}>Connect </span>With Your Loved One
                    </h3>
                    </div>
                    <div>

                        
                    </div>
           </div>


        </div>
    );
}    

