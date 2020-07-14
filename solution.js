{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator
        let floorNum = 4;
        
        let waitList = -1;
        
        for (let floor of floors) {
            floorListen(floor);
        }

        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", function() {
            let calledFloors = elevator.getPressedFloors();
            if (calledFloors.length>0) {
                for (let floor of calledFloors) {                    
                    elevator.goToFloor(floor);
                }  
            }
            
            if (waitList!==-1) {
                elevator.goToFloor(floor);
                waitList = -1;
            }
       
            //Clear the indicators
            console.log('DONE!');
        });
        
        elevator.on("floor_button_pressed", function(floorNum) {
            // Maybe tell the elevator to go to that floor?
            elevator.goToFloor(floorNum);
        });
        
         
        function floorListen(floor) {
            const floorNum = floor.floorNum();
            const calledFloors = elevator.getPressedFloors();
            
            floor.on("up_button_pressed", function() {
                console.log('UP PRESSED')
                if (calledFloors.length>0) {
                    if (floorNum>elevator.currentFloor() && elevator.destinationDirection()==="up") {
                        elevator.goToFloor(floorNum);
                    } else if (waitList===-1) {
                        waitList = floorNum;
                    } 
                } else elevator.goToFloor(floorNum);
            });

            floor.on("down_button_pressed", function() {
                if (calledFloors.length>0) {
                    if (floorNum<elevator.currentFloor() && elevator.destinationDirection()==="down") {
                        elevator.goToFloor(floorNum);
                    } else if (waitList===-1) {
                        waitList = floorNum;
                    }
                } else elevator.goToFloor(floorNum);
            });

        }

    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}