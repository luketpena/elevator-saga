{
    init: function(elevators, floors) {
        console.log(elevators);

        /*--------< Define Functions >--------*/
        //#region Direction Controls
        function setDirection(e,direction) {
            e.goingUpIndicator( (direction==="up") );
            e.goingDownIndicator( (direction==="down") );
        }

        function emptyDirection(e) {
            e.goingDownIndicator(false);
            e.goingUpIndicator(false);
        }

        function getDirection(e) {
            const up = e.goingUpIndicator();
            const down = e.goingDownIndicator();
            if (up && !down) return "up";
            if (down && !up) return "down";
            
            return "none";
        }
        //#endregion
        //#region Other Functions
        function sortArray(array,direction) {
            switch(direction) {
                case "up":  return array.sort(function(a, b){return a-b});
                case "down": return array.sort(function(a, b){return b-a});
            }
            return array;
        }
         
        function findActiveFloors(e,index) {
            //Checking to see if any floors have their buttons pressed
            let currentFloor = e.currentFloor();
            let activeFloors = floors.filter( f=> (f.buttonStates.up || f.buttonStates.down));
            if (activeFloors.length>0) {
  
                let nearestFloor = activeFloors[0].level;
                let freeUp = true; //Indicates that the floor has unclaimed passengers going up
                let freeDown = true; //Indicates that the floor has unclaimed passengers going down 
                let direction = 'any'; //Defaults to empty, only changes if required

                for (let f of activeFloors) {
                    //Checking the distance of floors with math
                    if (Math.abs(currentFloor.level-f.level)<Math.abs(currentFloor.level-nearestFloor)) {
                        //We have to check if someone is already going there
                        
                        elevators.forEach( (elevator,i)=> {
                            //If the index is in their queue
                            if (i!==index && elevator.destinationQueue.indexOf(f.level)!==-1) {  
                                //Check if someone else is going to it up OR down
                                let goingUpCheck = (getDirection(elevator)==='up' && f.buttonStates.up);
                                let goingDownCheck = (getDirection(elevator)==='down' && f.buttonStates.down);
                                if (goingUpCheck) targetedForUp = false;
                                if (goingDownCheck) targetedForDown = false;
                            }
                        });                  
                    } //END of check if floor is closer

                    //If a free up or down position is found, then
                    if (freeUp || freeDown) {
                        nearestFloor = f.level;
                        if (freeUp && freeDown) {
                            direction = 'any';
                        } else {
                            if (freeUp && !freeDown) direction = 'up';
                            if (!freeUp && freeDown) direction = 'down';
                        }
                    } //END free up and down check   
                } //END loop through floors              

                if (nearestFloor!==currentFloor.level) {
                    //If a different floor is close and populated, go to that floor
                    if (direction==='any') {
                        //Favors going down if in the upper half and vice versa
                        if (nearestFloor>floors.length/2) {
                            setDirection(e,'down');
                        } else {
                            setDirection(e,'up');
                        }
                    } else {
                        setDirection(e,direction);
                    }
                    e.goToFloor(nearestFloor);
                }   
            } //END active floor length check
        } //END fincActiveFloors function
        //#endregion  

        /*--------< Initiate Elevators and Floors >--------*/
        elevators.forEach( (e,i)=> elevatorInit(e,i));
        floors.forEach( (f,i)=> floorInit(f,i));

        /*--------< Running the Elevators >--------*/
        function elevatorInit(e,index) {
            //Starts at a default empty state
            setDirection(e,'none');

            //#region Elevator Idle
            e.on('idle', ()=>{
                //Setup
                let direction = getDirection(e);
                let pressedFloors = sortArray(e.getPressedFloors(),direction);

                if (pressedFloors.length>0) {
                    //If floors are loaded up, go to those floors
                    for (let f of pressedFloors) {
                        e.goToFloor(f);
                    }
                } else {
                    let currentFloor = floors[e.currentFloor()];
                    //This forces passengers to load up at the current floor if elevator is idled at their level
                    e.goToFloor(e.currentFloor());

                    if (currentFloor>floors.length/2) {
                        if (currentFloor.buttonStates.down) setDirection(e,'down')
                        else if (currentFloor.buttonStates.up) setDirection(e,'up')
                        else findActiveFloors(e,index);
                    } else {
                        if (currentFloor.buttonStates.up) setDirection(e,'up')
                        else if (currentFloor.buttonStates.down) setDirection(e,'down')
                        else findActiveFloors(e,index);
                    }                       
                } //END looking for populated floors
            });
            //#endregion

            //#region Elevator Passing Floor
            e.on('passing_floor', (floorNum,direction)=>{ 
                setDirection(e,direction);
                //This limiter forces it to prioritize deliver a mostly empty elevator rather than interrupting its movement 
                if (e.loadFactor()===0) {
                    let queue = e.destinationQueue;
                    for (let elevator of elevators) {
                        //If the index is in their queue
                        if (elevator.destinationQueue.indexOf(queue[0])!==-1) {
                            console.log('DUPLICATE TARGET!'); 
                            e.stop();
                            setDirection(e,'none');
                            findActiveFloors(e,index);
                            break;
                        }
                    }

                } else if (e.loadFactor()<.8) {
                    const floor = floors[floorNum];
                    //Checking if the floor has an active button that matches movement direction
                    if ( (floor.buttonStates.up && direction==='up') || (floor.buttonStates.down && direction==='down')) {
                        let newQueue = sortArray([floorNum, ...e.destinationQueue], direction);
                        e.stop();
                        newQueue.forEach(f=>e.goToFloor(f));
                    }
                }
            });
            //#endregion
        }

        function floorInit(f,index) {
            
            function checkElevators(direction) {
                //Check if any elevators are empty
                let emptyElevators = elevators.filter(e=> {return getDirection(e)==='none'});
                if (emptyElevators.length>0) {
                    let nearestElevator = emptyElevators[0];
                    //Find which elevator is closest
                    emptyElevators.forEach(e=>{
                        let currentFloor = e.currentFloor();
                        if (Math.abs(index-currentFloor)<Math.abs(index-nearestElevator.currentFloor() )) {
                            nearestElevator = e;
                        }
                    });
                    //Call that elevator to this floor
                    setDirection(nearestElevator,direction);
                    nearestElevator.goToFloor(index);
                }
            }
            //Trigger looking for nearby empty elevators on button presses
            f.on('up_button_pressed',   ()=> checkElevators("up"));
            f.on('down_button_pressed', ()=> checkElevators("down"));
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}