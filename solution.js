{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator
        let floorNum = 4;

        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", function() {
            let calledFloors = elevator.getPressedFloors();
            if (calledFloors.length>0) {
                for (let floor of calledFloors) {
                    elevator.goToFloor(floor);
                }  
            }
       
            //Clear the indicators
            console.log('DONE!');
        });
        
        elevator.on("floor_button_pressed", function(floorNum) {
            // Maybe tell the elevator to go to that floor?
            elevator.goToFloor(floorNum);
        });
        
 
        

    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}