//
//  VRBuildGrabScale.js
//  
//  Created by Basinsky on 2 Feb 2020
//  
//  Script to scale in separate XYZ directions by grabbing. 
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
var WANT_DEBUG = false;
var isGrabLeftInProgress = false;
var isGrabRightInProgress = false;
var isGrabLeftAndRight = false;
var grabbedLeftEntityID;
var grabbedRightEntityID;
var channelName = "Hifi-Object-Manipulation";
var closeEntities = [];
var entityToBeGrabbedID;
var RIGHT_JOINT = MyAvatar.getJointIndex("RightHandMiddle1");
var LEFT_JOINT = MyAvatar.getJointIndex("LeftHandMiddle1");
var startHandDistance = 0;
var isScaling = false;
var newScale = 1;
var oldDimensions;
var newDimensions = { x: 1, y: 1, z: 1 };
var overlayPosition;
var entityPosition = { x: 0, y: 0, z: 0 };
var entityRotation;
var isDirectionFound = false;
var handPositionLeft;
var handPositionRight;
var SCALE_RATIO = 0.3;
var GIZMO_CYLINDER_LENGTH = 0.3;
var GIZMO_CYLINDER_LENGTH_RATIO = 0.025;
var GIZMO_CYLINDER_DIAMETER = GIZMO_CYLINDER_LENGTH * GIZMO_CYLINDER_LENGTH_RATIO;
var GIZMO_CENTER_DIAMETER = 0.05;
var GIZMO_END_DIAMETER = 0.02;
var GIZMO_END_POSITION = GIZMO_CYLINDER_LENGTH * 0.5;
var GIZMO_DEFAULT_SCALE = 0.2;
var LIFETIME = 300; // sec
var EXPIRE_OFFSET = 10; // sec
var SEC_TO_MS = 1000;
var gizmoShapeIDs = [];
var DECIMAL_PRECISION = 4;
var ENTITIES_TO_UPDATE;
var gizmoCenterID;
var gizmoXaxisID;
var gizmoYaxisID;
var gizmoZaxisID;
var gizmoXplusID;
var gizmoXminusID;
var gizmoYplusID;
var gizmoYminusID;
var gizmoZplusID;
var gizmoZminusID;
var debugRightHandID;
var debugLeftHandID;
var minimum = 1000;
var index = -1; 
var distanceToGizmoXplus = 0;
var distanceToGizmoXmin = 0;
var distanceToGizmoYplus = 0;
var distanceToGizmoYmin = 0;
var distanceToGizmoZplus = 0;
var distanceToGizmoZmin = 0;
var isScaleModeX = false;
var isScaleModeY = false;
var isScaleModeZ = false;
var gizmoEndpointsDistanceLeft = [];
var gizmoEndpointsDistanceRight = [];
var rightGripState = 0;
var leftGripState = 0;
var LEFT_HAND_INDEX = MyAvatar.getJointIndex("LeftHand");
var RIGHT_HAND_INDEX = MyAvatar.getJointIndex("RightHand");


var overlayID = Overlays.addOverlay("text3d", {
    text: "hover",
    visible: true,
    backgroundAlpha: 0.2,
    isFacingAvatar: true,
    lineHeight: 0.05,
    dimensions: { x: 2, y: 0.5, z: 0.5 },
    drawInFront: true
}, "local"); 

function createGizmo() {    
    gizmoCenterID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "gizmoCenter",        
        description: "",            
        position: { x: 0, y: 0, z: 0},      
        lifetime: LIFETIME,
        color: { r: 100, g: 100, b: 100 },
        renderLayer: "front",
        alpha: 0.5,
        dimensions: { x: GIZMO_CENTER_DIAMETER, y: GIZMO_CENTER_DIAMETER, z: GIZMO_CENTER_DIAMETER },
        collisionless: true,       
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoCenterID);
  
    var tempRotation = Quat.fromPitchYawRollRadians(0, 0, 0);
    gizmoXaxisID = Entities.addEntity({
        type: "Shape",        
        shape: "Cylinder",                       
        name: "x-axis",
        parentID: gizmoCenterID,        
        description: "",            
        localPosition: { x: 0, y: 0, z: 0 },
        localRotation: tempRotation,      
        lifetime: LIFETIME,
        color: { r: 100, g: 0, b: 0 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_CYLINDER_DIAMETER, y: GIZMO_CYLINDER_LENGTH, z: GIZMO_CYLINDER_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false} }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoXaxisID);

    tempRotation = Quat.fromPitchYawRollRadians(0 , 0 ,-Math.PI/2);  
    gizmoYaxisID = Entities.addEntity({
        type: "Shape",        
        shape: "Cylinder",                       
        name: "y-axis",
        parentID: gizmoCenterID,        
        description: "",            
        localPosition: { x: 0, y: 0, z: 0 },
        localRotation: tempRotation,      
        lifetime: LIFETIME,
        color: { r: 0, g: 100, b: 0 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_CYLINDER_DIAMETER, y: GIZMO_CYLINDER_LENGTH, z: GIZMO_CYLINDER_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoYaxisID);

    tempRotation = Quat.fromPitchYawRollRadians(-Math.PI/2,0,0);
    gizmoZaxisID = Entities.addEntity({
        type: "Shape",        
        shape: "Cylinder",                       
        name: "z-axis",
        parentID: gizmoCenterID,        
        description: "",            
        localPosition: { x: 0, y: 0, z: 0 },
        localRotation: tempRotation,      
        lifetime: LIFETIME,
        color: { r: 0 ,g: 0, b: 100 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_CYLINDER_DIAMETER, y: GIZMO_CYLINDER_LENGTH, z: GIZMO_CYLINDER_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoZaxisID);

    gizmoXplusID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "x-plus",
        parentID: gizmoXaxisID,        
        description: "",            
        localPosition: { x: 0, y: GIZMO_END_POSITION, z: 0 },         
        lifetime: LIFETIME,
        color: { r: 255, g: 0, b: 0 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_END_DIAMETER, y: GIZMO_END_DIAMETER, z: GIZMO_END_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoXplusID);

    gizmoXminusID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "x-minus",
        parentID: gizmoXaxisID,        
        description: "",            
        localPosition: { x: 0, y: -GIZMO_END_POSITION, z: 0 },
        lifetime: LIFETIME,
        color: { r: 255, g: 0, b: 0},
        renderLayer: "front",
        alpha: 1,
        dimensions: {x: GIZMO_END_DIAMETER,y: GIZMO_END_DIAMETER,z: GIZMO_END_DIAMETER},
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoXminusID);

    gizmoYplusID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "y-plus",
        parentID: gizmoYaxisID,        
        description: "",            
        localPosition: { x: 0, y: GIZMO_END_POSITION, z: 0 },         
        lifetime: LIFETIME,
        color: { r: 0, g: 255, b: 0 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_END_DIAMETER, y: GIZMO_END_DIAMETER, z: GIZMO_END_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoYplusID);

    gizmoYminusID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "y-minus",
        parentID: gizmoYaxisID,        
        description: "",            
        localPosition: { x: 0, y: -GIZMO_END_POSITION, z: 0 },
        lifetime: LIFETIME,
        color: { r: 0, g: 255, b: 0 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_END_DIAMETER, y: GIZMO_END_DIAMETER, z: GIZMO_END_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoYminusID);

    gizmoZplusID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "z-plus",
        parentID: gizmoZaxisID,        
        description: "",            
        localPosition: { x: 0, y: GIZMO_END_POSITION, z: 0 },         
        lifetime: LIFETIME,
        color: { r: 0, g: 0, b: 255 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_END_DIAMETER, y: GIZMO_END_DIAMETER, z: GIZMO_END_DIAMETER },
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoZplusID);

    gizmoZminusID = Entities.addEntity({
        type: "Shape",        
        shape: "Sphere",                       
        name: "z-minus",
        parentID: gizmoZaxisID,        
        description: "",            
        localPosition: { x: 0, y: -GIZMO_END_POSITION, z: 0},
        lifetime: LIFETIME,
        color: { r: 0, g: 0, b: 255 },
        renderLayer: "front",
        alpha: 1,
        dimensions: { x: GIZMO_END_DIAMETER, y: GIZMO_END_DIAMETER, z: GIZMO_END_DIAMETER},
        ignoreForCollisions: true,
        userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
    },"avatar");
    gizmoShapeIDs.push(gizmoZminusID);
    ENTITIES_TO_UPDATE = [gizmoXplusID, gizmoXminusID, gizmoYplusID, gizmoYminusID, gizmoZplusID, gizmoZminusID];
    // add spheres at joint positions for debugging
    if (WANT_DEBUG) {
        debugLeftHandID = Entities.addEntity({
            type: "Shape",        
            shape: "Sphere",                       
            name: "gizmoCenter",
            parentID: MyAvatar.sessionUUID,
            parentJointIndex: LEFT_JOINT,        
            description: "",            
            localPosition: { x: 0, y: 0, z: 0},      
            lifetime: LIFETIME,
            color: { r: 255, g: 100, b: 100 },
            renderLayer: "front",
            alpha: 0.5,
            localDimensions: { x: 0.05, y: 0.05, z: 0.05 },
            collisionless: true,
            userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
        },"avatar");
        gizmoShapeIDs.push(debugLeftHandID);   
        debugRightHandID = Entities.addEntity({
            type: "Shape",        
            shape: "Sphere",                       
            name: "gizmoCenter",
            parentID: MyAvatar.sessionUUID,
            parentJointIndex: RIGHT_JOINT,         
            description: "",            
            localPosition: { x: 0, y: 0, z: 0},      
            lifetime: LIFETIME,
            color: { r: 100, g: 255, b: 100 },
            renderLayer: "front",
            alpha: 0.5,
            localDimensions: { x: 0.05, y: 0.05, z: 0.05 },
            collisionless: true,
            userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false } }"    
        },"avatar");
        gizmoShapeIDs.push(debugRightHandID); 
    }    
}

function updateOverlay() {
    overlayPosition = Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, { x: 0, y: 2, z: -2 }));  
    var nameR;
    var nameL;    
    if (grabbedRightEntityID) {
        nameR = Entities.getEntityProperties(grabbedRightEntityID,["name"]).name;
    }
    if (grabbedLeftEntityID) {
        nameL = Entities.getEntityProperties(grabbedLeftEntityID,["name"]).name;
    }    
    var text = [
        "  GrabLeft: " + isGrabLeftInProgress + 
        "  GrabRight: " + isGrabRightInProgress +
        "  isGrabLeftAndRight: " + isGrabLeftAndRight,
        "  gripStateLeft: " + leftGripState + "  gripStateRight: " + rightGripState,        
        "  isScaling: " + isScaling + " newScale: " + newScale,
        "  GrabbedLeftName: " + nameL + "  GrabbedRightName: " + nameR,
        "  GrabbedLeftID: " + grabbedLeftEntityID + "  GrabbedRightID: " + grabbedRightEntityID,
        "  HandposLeft:  " + JSON.stringify(Vec3.subtract(handPositionLeft,MyAvatar.position)),
        "  HandposRight:  " + JSON.stringify(Vec3.subtract(handPositionRight,MyAvatar.position)),        
        "  dxplus: " + distanceToGizmoXplus.toFixed(DECIMAL_PRECISION) +
        "  dyplus: " + distanceToGizmoYplus.toFixed(DECIMAL_PRECISION) +
        "  dzplus: " + distanceToGizmoZplus.toFixed(DECIMAL_PRECISION),
        "  dxmin: " + distanceToGizmoXmin.toFixed(DECIMAL_PRECISION) +
        "  dymin: " + distanceToGizmoYmin.toFixed(DECIMAL_PRECISION) +
        "  dzmin: " + distanceToGizmoZmin.toFixed(DECIMAL_PRECISION),        
        "  isScaleModeX:  " + isScaleModeX + "  isScaleModeY:  " + isScaleModeY +"  isScaleModeZ:  " + isScaleModeZ,
        "  index:   "+ index + "minimum:   " + minimum.toFixed(DECIMAL_PRECISION)       
    ].filter(Boolean).join('\n');

    Overlays.editOverlay(overlayID, {
        text: text,
        position: overlayPosition      
    });
}

function updateGizmoPositionRotation(gizmoPos, gizmoRot) {
    var tempRotation = Quat.fromPitchYawRollRadians(0, 0, -Math.PI * 0.5 );
    Entities.editEntity(gizmoCenterID, {
        position: gizmoPos,        
        rotation: Quat.multiply(gizmoRot, tempRotation)
    });
}

function getJointIndex() {
    RIGHT_JOINT = MyAvatar.getJointIndex("RightHandMiddle1");
    LEFT_JOINT = MyAvatar.getJointIndex("LeftHandMiddle1");
    if (RIGHT_JOINT === -1) {
        RIGHT_JOINT = MyAvatar.getJointIndex("RightHand");        
    }
    if (LEFT_JOINT === -1) {
        LEFT_JOINT = MyAvatar.getJointIndex("LeftHand");        
    }
    if (LEFT_JOINT === -1 || RIGHT_JOINT === -1) {
        print("Avatar has no hand Joints");        
    }
}


function updateGizmoScale(scaleUpdateX, scaleUpdateY, scaleUpdateZ) {
    Entities.editEntity(gizmoXaxisID, {        
        localDimensions: { x: GIZMO_CYLINDER_DIAMETER, y: GIZMO_CYLINDER_LENGTH*scaleUpdateX*2, z: GIZMO_CYLINDER_DIAMETER }        
    });
    Entities.editEntity(gizmoYaxisID, {        
        localDimensions: { x: GIZMO_CYLINDER_DIAMETER, y: GIZMO_CYLINDER_LENGTH*scaleUpdateY*2, z: GIZMO_CYLINDER_DIAMETER }       
    });
    Entities.editEntity(gizmoZaxisID, {        
        localDimensions: { x: GIZMO_CYLINDER_DIAMETER, y: GIZMO_CYLINDER_LENGTH*scaleUpdateZ*2, z: GIZMO_CYLINDER_DIAMETER }       
    });
    Entities.editEntity(gizmoXplusID, {
        localPosition: {x: 0, y: GIZMO_END_POSITION*scaleUpdateX*2, z: 0 }       
    });
    Entities.editEntity(gizmoXminusID, {
        localPosition: { x: 0, y: -GIZMO_END_POSITION*scaleUpdateX*2, z: 0 }       
    });
    Entities.editEntity(gizmoYplusID, {
        localPosition: { x: 0, y: GIZMO_END_POSITION*scaleUpdateY*2, z: 0 }       
    });
    Entities.editEntity(gizmoYminusID, {
        localPosition: { x: 0, y: -GIZMO_END_POSITION*scaleUpdateY*2, z: 0 }
    });
    Entities.editEntity(gizmoZplusID, {
        localPosition: { x: 0, y: GIZMO_END_POSITION*scaleUpdateZ*2, z: 0 }       
    });
    Entities.editEntity(gizmoZminusID, {
        localPosition: { x: 0, y: -GIZMO_END_POSITION*scaleUpdateZ*2, z: 0 }       
    });   
}

function hideGizmo() {
    for (var i in gizmoShapeIDs) {
        Entities.editEntity(gizmoShapeIDs[i], { visible: false });
    }
}

function showGizmo() {
    for (var i in gizmoShapeIDs) {
        Entities.editEntity(gizmoShapeIDs[i], { visible: true});
    }
}

function isGizmo(id) {
    return gizmoShapeIDs.indexOf(id) !== -1;        
}

function startScaling() {    
    if (!isScaling) {               
        showGizmo();
        var startHandPositionLeft = MyAvatar.getJointPosition(LEFT_JOINT);
        var startHandPositionRight = MyAvatar.getJointPosition(RIGHT_JOINT);
        startHandDistance = Vec3.distance(startHandPositionLeft,startHandPositionRight);
        isScaling = true;
        oldDimensions = Entities.getEntityProperties(entityToBeGrabbedID,["dimensions"]).dimensions;        
    }
    var handDistance = Vec3.distance(handPositionLeft,handPositionRight);
    newScale = handDistance / startHandDistance;
    var scaleX = 1;
    var scaleY = 1;
    var scaleZ = 1;
    if (isScaleModeX) {
        newDimensions = { x: oldDimensions.x * newScale , y: oldDimensions.y, z: oldDimensions.z };
        scaleX = newScale;        
    } 
    if (isScaleModeY) {
        newDimensions = { x: oldDimensions.x, y: oldDimensions.y* newScale, z: oldDimensions.z };       
        scaleY = newScale;        
    }
    if (isScaleModeZ) {
        newDimensions = { x: oldDimensions.x, y: oldDimensions.y, z: oldDimensions.z* newScale };       
        scaleZ = newScale;
    }
    if (isScaleModeX || isScaleModeY || isScaleModeZ) {    
        Entities.editEntity(entityToBeGrabbedID,{dimensions: newDimensions});    
        updateGizmoScale(
            scaleX*SCALE_RATIO, 
            scaleY*SCALE_RATIO, 
            scaleZ*SCALE_RATIO); 
    }         
}


function startBuilding() {
    if (WANT_DEBUG) {
        updateOverlay();
    }    
    if (isGrabLeftInProgress || isGrabRightInProgress) {
        if (grabbedLeftEntityID) {
            entityToBeGrabbedID = grabbedLeftEntityID;
        }
        if (grabbedRightEntityID) {
            entityToBeGrabbedID = grabbedRightEntityID;
        }
        // use gripstate if other controller is outside grip diameter (0.3 m)
        if (grabbedLeftEntityID || grabbedRightEntityID) {
            rightGripState = Controller.getValue(Controller.Standard.RightGrip);        
            leftGripState = Controller.getValue(Controller.Standard.LeftGrip);        
            if (leftGripState > 0.5 && rightGripState > 0.5) {        
                isGrabLeftAndRight = true;  
            } else {
                isGrabLeftAndRight = false; 
            }
        }                            
    } else { 
        entityToBeGrabbedID = null;
        grabbedLeftEntityID = null;
        grabbedRightEntityID = null;
        isGrabLeftAndRight = false; 
        isScaling = false;
        isDirectionFound = false;
        isScaleModeX = false;
        isScaleModeY = false;
        isScaleModeZ = false;
        newScale = 2;
        index = -1;
        hideGizmo();       
    }

    if (isGrabLeftAndRight) {
        startScaling();
    }

    if (entityToBeGrabbedID) {        
        handPositionLeft = MyAvatar.getJointPosition(LEFT_JOINT);
        handPositionRight = MyAvatar.getJointPosition(RIGHT_JOINT);        
        var entityProperties = Entities.getEntityProperties(entityToBeGrabbedID,["position","rotation"]);
        entityPosition = entityProperties.position;
        entityRotation = entityProperties.rotation;         
        updateGizmoPositionRotation(entityPosition,entityRotation);
        var localPositions = Entities.getMultipleEntityProperties(ENTITIES_TO_UPDATE, "localPosition");
        for (var i = 0; i < localPositions.length; i++) {
            gizmoEndpointsDistanceLeft[i] = Vec3.distance(handPositionLeft,
                Entities.localToWorldPosition(localPositions[i].localPosition, ENTITIES_TO_UPDATE[i], -1));
            gizmoEndpointsDistanceRight[i+6] = Vec3.distance(handPositionRight,
                Entities.localToWorldPosition(localPositions[i].localPosition, ENTITIES_TO_UPDATE[i], -1));
        }
        minimum = Math.min(gizmoEndpointsDistanceLeft[0],
            gizmoEndpointsDistanceLeft[1],
            gizmoEndpointsDistanceLeft[2],
            gizmoEndpointsDistanceLeft[3],
            gizmoEndpointsDistanceLeft[4],
            gizmoEndpointsDistanceLeft[5],
            gizmoEndpointsDistanceRight[6],
            gizmoEndpointsDistanceRight[7],
            gizmoEndpointsDistanceRight[8],
            gizmoEndpointsDistanceRight[9],
            gizmoEndpointsDistanceRight[10],
            gizmoEndpointsDistanceRight[11]);        
    
        index = gizmoEndpointsDistanceLeft.indexOf(minimum);        
        if (index === 0 || index === 1 || index === 6 || index === 7) {
            if (!isDirectionFound) {
                isScaleModeX = true;
                isScaleModeY = false;
                isScaleModeZ = false;
                isDirectionFound = true;
            }
        }
        if (index === 2 || index === 3 || index === 8 || index === 9) {
            if (!isDirectionFound) {
                isScaleModeY = false;
                isScaleModeY = true;
                isScaleModeZ = false;
                isDirectionFound = true;
            }
        }
        if (index === 4 || index === 5 || index === 10 || index === 11) {
            if (!isDirectionFound) {
                isScaleModeZ = false;
                isScaleModeY = false;
                isScaleModeZ = true;
                isDirectionFound = true;
            }
        }
    }
}

Script.scriptEnding.connect(function() {
    Entities.deleteEntity(overlayID);     
    Entities.deleteEntity(gizmoCenterID);
    if (WANT_DEBUG) {
        Entities.deleteEntity(debugLeftHandID);
        Entities.deleteEntity(debugRightHandID);
    }
    Messages.messageReceived.disconnect(onMessageReceived);
    Messages.unsubscribe(channelName);
    Script.update.disconnect(startBuilding);
});

function onMessageReceived(channel, message, senderID) {
    if (channel === channelName && senderID === MyAvatar.sessionUUID) {   
        var action = JSON.parse(message).action;
        var actionHand = JSON.parse(message).joint;  
        if (action === "grab") {
            if (actionHand === "LeftHand") {
                grabbedLeftEntityID = JSON.parse(message).grabbedEntity;
                var checkLeft = isGizmo(grabbedLeftEntityID);
                if (!checkLeft) {
                    isGrabLeftInProgress = true;
                }
            }
            if (actionHand === "RightHand") {
                grabbedRightEntityID = JSON.parse(message).grabbedEntity;
                var checkRight = isGizmo(grabbedRightEntityID);
                if (!checkRight) {                         
                    isGrabRightInProgress = true;                
                }                             
            }
        }
        if (action === "release") {
            if (actionHand === "LeftHand") {   
                isGrabLeftInProgress = false;
                grabbedLeftEntityID = null;
            }
            if (actionHand === "RightHand") {                  
                isGrabRightInProgress = false;
                grabbedRightEntityID = null;
            }
        }
    }
}

MyAvatar.onLoadComplete.connect(function () { 
    if (WANT_DEBUG) {
        print("avatar model changed");
    }
    getJointIndex();
});

Messages.subscribe(channelName);
Messages.messageReceived.connect(onMessageReceived);
createGizmo();
getJointIndex();
updateGizmoScale(GIZMO_DEFAULT_SCALE);
var lifeTimeUpdater = Script.setInterval(function() {  
    if (gizmoCenterID) {
        Entities.deleteEntity (gizmoCenterID);
        createGizmo();
        print("lifetimeupdater");
    }
}, (LIFETIME - EXPIRE_OFFSET) * SEC_TO_MS);

Script.update.connect(startBuilding);
