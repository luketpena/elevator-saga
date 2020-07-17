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

        let masterQueue = [];
        
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
                e.destinationQueue = [];
                let pressedFloors = e.getPressedFloors();
                if (pressedFloors.length>0) {
                    //If floors are loaded up, go to those floors
                    e.stop();
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
                        if (masterQueue.length>0) {
              
                            for (let i=0; i<masterQueue.length; i++) {
                                let item = masterQueue[i];
                                setDirection(e,item.dir);
                                e.goToFloor(item.level);
                                masterQueue.shift();
                                console.log('Master queue:',masterQueue);
                            }

                        } //END active floor length check
                    } //END fincActiveFloors function
                } //END looking for populated floors

            });

            e.on('stopped_at_floor', (floorNum)=>{
                let floorUp = floors[floorNum].buttonStates.up;
                let floorDown = floors[floorNum].buttonStates.down;
                
                let direction = getDirection(e);

                if ((direction==='down' && floorDown) || (direction==='up' && floorUp)) masterQueue.unshift({level: floorNum, dir: direction});
            });

            e.on('passing_floor', (floorNum,direction)=>{     
                if (e.loadFactor()<.7) {
                    const floor = floors[floorNum];
                    if ( (floor.buttonStates.up && direction==='up') || (floor.buttonStates.down && direction==='down')) {
                        let newQueue = [floorNum, ...e.destinationQueue];

                        for (let i=0; i<masterQueue.length; i++) {
                            let item = masterQueue[i];
                            if (item.level===floor && item.dir===direction) {
                                masterQueue.splice(i,0);
                            }
                        }
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
                if (masterQueue.indexOf(f.level)===-1) masterQueue.push({level: f.level, dir: 'up'});
            })
            f.on('down_button_pressed', ()=> {
                checkElevators("down")
                if (masterQueue.indexOf(f.level)===-1) masterQueue.push({level: f.level, dir: 'down'});
            })
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}