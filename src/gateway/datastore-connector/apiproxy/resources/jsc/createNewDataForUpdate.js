/*
 Copyright 2017 Google Inc.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 https://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var response = JSON.parse(context.getVariable("getDatatstoreResponse.content"));

if (response.batch.entityResults && response.batch.entityResults[0]) {
  var props = response.batch.entityResults[0].entity.properties;
  var kind = context.getVariable("kind");

  var decodedResp = {};
  for (var key in props) {
    decodedResp[key] = decodeValueProto(props[key])
  }
  var uuid = decodedResp.uuid;
  var putRequest = JSON.parse(context.getVariable("originalRequest"));
  for (var key in putRequest) {

    decodedResp[key] = putRequest[key];
  }
  var finalResponse = JSON.parse(JSON.stringify(decodedResp));
  var properties = {};
  for (var key in decodedResp) {
    properties[key] = encodeValue(decodedResp[key])
  }
  var dsPayload = {
    "mode": "NON_TRANSACTIONAL",
    "mutations": [
      {
        "update": {
          "key": {
            "path": [
              {
                "kind": kind,
                "name": uuid
              }
            ]
          },
          "properties": properties
        }
      }
    ]
  };

  finalResponse = {"entities": [finalResponse]};
  context.setVariable("request.content", JSON.stringify(dsPayload));
  context.setVariable("responsePayload", JSON.stringify(finalResponse));
}
else {
  var pathSuffix = ":commit";
  var kind = context.getVariable("kind");

  var dsPayload = {
    "mode": "NON_TRANSACTIONAL",
    "mutations": [
      {
        "insert": {
          "key": {
            "path": [
              {
                "kind": kind,
                "name": uuid
              }
            ]
          },
          "properties": {}
        }
      }
    ]
  };
  var entity = JSON.parse(context.getVariable("request.content"));
  var response = JSON.parse(JSON.stringify(entity));
  var encodedEntity = {};
  var mutationObj = {};
  if (entity instanceof Array) {
    for (var j = 0; j < entity.length; j++) {
      var uuid = generateUUID();
      entity[j].uuid = uuid;
      response[j].uuid = uuid;
      encodedEntity = {};
      for (var key in entity[j]) {
        encodedEntity[key] = encodeValue(entity[j][key])
      }
      mutationObj = {};
      mutationObj.insert = {};
      mutationObj.insert.key = {};
      mutationObj.insert.key.path = [{"kind": kind, "name": uuid}];
      mutationObj.insert.properties = encodedEntity;
      dsPayload.mutations.push(mutationObj);

    }

    response = {"entities": response};
  }
  else {
    var uuid = generateUUID();
    entity.uuid = uuid;
    response.uuid = uuid;
    var encodedEntity = {};
    for (var key in entity) {
      encodedEntity[key] = encodeValue(entity[key])
    }
    dsPayload = {
      "mode": "NON_TRANSACTIONAL",
      "mutations": [
        {
          "insert": {
            "key": {
              "path": [
                {
                  "kind": kind,
                  "name": uuid
                }
              ]
            },
            "properties": encodedEntity
          }
        }
      ]
    };

    response = {"entities": [response]};
  }
  context.setVariable("request.verb", "POST");
  context.setVariable("pathSuffix", pathSuffix);
  context.setVariable("responsePayload", JSON.stringify(response));
  context.setVariable("request.content", JSON.stringify(dsPayload));

}