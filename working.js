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
        
      
        const floorCount = floors.length;


        for (let e of elevators) {
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
                    console.log('Going places...');
                    for (let f of pressedFloors) {
                        e.goToFloor(f);
                    }
                } else {
                    console.log('IDLE!');
                    let currentFloor = floors[e.currentFloor()];
                    e.goToFloor(e.currentFloor());
                    if (currentFloor.buttonStates.up) setDirection(e,'up')
                    else if (currentFloor.buttonStates.down) setDirection(e,'down')
                    else {
                        let activeFloors = floors.filter( f=> (f.buttonStates.up || f.buttonStates.down));
                        if (activeFloors.length>0) {
                            let nearestFloor = activeFloors[0].level;
                            for (let f of activeFloors) {
                                if (Math.abs(currentFloor.level-f.level)<Math.abs(currentFloor.level-nearestFloor)) {
                                    nearestFloor = f.level;
                                }
                            }
                            if (nearestFloor!==currentFloor.level) {
                                console.log('NEAREST POPULATE LEVEL:',nearestFloor);
                                if (floors[nearestFloor].buttonStates.up) setDirection(e,'up')
                                else if (floors[nearestFloor].buttonStates.down) setDirection(e,'down');
                                e.goToFloor(nearestFloor);
                            }
                        }
                    }
                }

            });

            e.on('stopped_at_floor', (floorNum)=>{
                let calledFloors = e.getPressedFloors();
                let eDirection = getDirection(e);
                let floor = floors[floorNum];

               console.log('STOPPED!');

            });

            e.on('passing_floor', (floorNum,direction)=>{
                const floor = floors[floorNum];
                
                if ( (floor.buttonStates.up && direction==='up') || (floor.buttonStates.down && direction==='down')) {
                    let newQueue = [floorNum, ...e.destinationQueue];
                    e.stop();
                    for (let f of newQueue) {
                        e.goToFloor(f);
                    }
                }
                console.log(e.destinationQueue);
            });

        }

        function floorInit(f,index) {
            
            function checkElevators(direction) {
                for (let e of elevators) {
                    let eCurrentFloor = e.currentFloor();
                    let eDirection = getDirection(e);
                    
                    if (eDirection==='none') {
                        setDirection(e,direction);
                        e.goToFloor(index);
                    }
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