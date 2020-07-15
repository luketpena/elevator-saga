{
    init: function(elevators, floors) {
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
                case "desc": return array.sort(function(a, b){return b-a});
                case "asc":  return array.sort(function(a, b){return a-b});
            }
            return array;
        }
        //#endregion
        
        for (let i=0; i<elevators.length; i++) {
            let e = elevators[i];

            console.log(e);
            elevatorInit(e);
            setDirection(e,'none');
        }

        for (let i=0; i<floors.length; i++) {
            floorInit(floors[i],i);
        }

        function elevatorInit(e) {

            e.on('idle', ()=>{
                
                let pressedFloors = e.getPressedFloors();
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
                        else findActiveFloors();
                    } else {
                        if (currentFloor.buttonStates.up) setDirection(e,'up')
                        else if (currentFloor.buttonStates.down) setDirection(e,'down')
                        else findActiveFloors();
                    }                    

                    function findActiveFloors() {
                        //Checking to see if any floors have their buttons pressed
                        let activeFloors = floors.filter( f=> (f.buttonStates.up || f.buttonStates.down));
                        if (activeFloors.length>0) {
              
                            let nearestFloor = activeFloors[0].level;
                            let freeUp = true;
                            let freeDown = true;
                            let direction = 'any';

                            for (let f of activeFloors) {
                                //Checking the distance of floors with math
                                if (Math.abs(currentFloor.level-f.level)<Math.abs(currentFloor.level-nearestFloor)) {
                                    //We have to check if someone is already going there
                                    
                                    for (let e of elevators) {
                                        //If the index is in their queue
                                        if (e.destinationQueue.indexOf(f.level)!==-1) {
                                            //Check if someone is going to it up OR down
                                            let goingUpCheck = (getDirection(e)==='up' && f.buttonStates.up);
                                            let goingDownCheck = (getDirection(e)==='down' && f.buttonStates.down);
                                            if (goingUpCheck) targetedForUp = false;
                                            if (goingDownCheck) targetedForDown = false;
                                        }
                                    }
                                    if (freeUp || freeDown) {
                                        nearestFloor = f.level;
                                        if (freeUp && freeDown) {
                                            direction = 'any'
                                        } else {
                                            if (freeUp && !freeDown) direction = 'up';
                                            if (!freeUp && freeDown) direction = 'down';
                                        }
                                    } //END free up and down check                                   
                                } //END of check if floor is closer
                            }

                            if (nearestFloor!==currentFloor.level) {
                                //If a different floor is close and populated, go to that floor
                                console.log('NEAREST POPULATED LEVEL:',nearestFloor);
                                if (direction==='any') {
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
                } //END looking for populated floors

            });

            e.on('passing_floor', (floorNum,direction)=>{     
                if (e.loadFactor()<.8) {
                    const floor = floors[floorNum];
                    if ( (floor.buttonStates.up && direction==='up') || (floor.buttonStates.down && direction==='down')) {
                        let newQueue = [floorNum, ...e.destinationQueue];
                        e.stop();
                        for (let f of newQueue) {
                            e.goToFloor(f);
                        }
                    }
                }
            });

        }

        function floorInit(f,index) {
            
            function checkElevators(direction) {
                let elevatorList = []
                for (let e of elevators) {
                    
                    let eDirection = getDirection(e);
                    

                    if (eDirection==='none') {
                        elevatorList.push(e);
                    }
                }
                if (elevatorList.length>0) {
                    let nearestElevator = elevatorList[0];
                    for (let e of elevatorList) {
                        let currentFloor = e.currentFloor();
                        if (Math.abs(index-currentFloor)<Math.abs(index-nearestElevator.currentFloor() )) {
                            nearestElevator = e;
                        }
                    }
                    setDirection(nearestElevator,direction);
                    nearestElevator.goToFloor(index);
                }
            }

            f.on('up_button_pressed', ()=> {
                checkElevators("up");
            })
            f.on('down_button_pressed', ()=> {
                checkElevators("down")
            })
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}