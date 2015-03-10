/**
 * Copyright 2014-2015 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */


angular.module('greenbus.views.measurementValue', []).

  factory('gbMeasurementValueRest', ['rest', function( rest) {

    /**
     * Override measurements for a point.
     *
     * @param pointId Point ID to be overridden
     * @param value The new value as a string
     * @param valueType The type of the value to override. BOOL, INT, DOUBLE, STRING
     * @param success Success callback
     * @param failure Failure callback
     */
    function override( pointId, value, valueType, callee, success, failure) {

      var arg = {
            value: value,
            valueType: valueType
          },
          url = '/models/1/points/' + pointId + '/override'

      rest.post( url, arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR overriding point with ID: ' + pointId + ' to value "' + value + '" with type: "' + valueType + '". Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Put a point NIS (Not In Service)
     *
     * @param pointId Point ID to be overridden
     */
    function nis( pointId, callee, success, failure) {

      var arg,
          url = '/models/1/points/' + pointId + '/nis'

      rest.post( url, arg, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR setting NIS point with ID: ' + pointId + '. Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    /**
     * Remove a point's override or NIS (Not In Service)
     *
     * @param pointId Point ID to remove the override or NIS.
     */
    function remove( pointId, callee, success, failure, nisOrOverride) {

      var url = '/models/1/points/' + pointId + '/' + nisOrOverride

      rest.delete( url, null, null,
        function( data) {
          success.call( callee, data)
        },
        function( ex, statusCode, headers, config){
          console.log( 'gbMeasurementValueRest ERROR removing ' + nisOrOverride + ' on point with ID: ' + pointId + '. Exception: ' + ex.exception + ' - ' + ex.message)
          failure.call( callee, pointId, ex, statusCode)
        }
      )

      return true
    }

    function removeNis( pointId, callee, success, failure) { remove( pointId, callee, success, failure, 'nis')}
    function removeOverride( pointId, callee, success, failure) { remove( pointId, callee, success, failure, 'override')}


    /**
     * Public API
     */
    return {
      override: override,
      nis: nis,
      removeNis: removeNis,
      removeOverride: removeOverride
    }
  }]).

  controller( 'gbMeasurementValueController', ['$scope', 'gbMeasurementValueRest', function( $scope, gbMeasurementValueRest) {
    var self = this
    $scope.editMode = undefined // {value: '', valueType: ''}
    $scope.canRemove = false
    $scope.canNis = false
    $scope.removeTooltip = undefined // Remove NIS, Remove Replace
    $scope.placeHolder = ''
    $scope.requestPending = undefined
    $scope.requestError = undefined


    self.configureInput = function() {
      var m = $scope.model.currentMeasurement
      switch( m.shortQuality) {
        case 'R':
          $scope.canRemove = true
          $scope.canNis = true
          $scope.removeTooltip = 'Remove replace'
          break
        case 'N':
          $scope.canRemove = true
          $scope.canNis = false
          $scope.removeTooltip = 'Remove NIS'
          break
        default:
          $scope.canRemove = false
          $scope.canNis = true
          $scope.removeTooltip = undefined
          break
      }

      // set focus and select text
    }

    self.getRemoveTooltip = function() {
      var m = $scope.model.currentMeasurement
      switch( m.shortQuality) {
        case 'R': return $scope.removeTooltip = 'Remove replace'
        case 'N': return $scope.removeTooltip = 'Remove NIS'
        default: return $scope.removeTooltip = undefined
      }
    }

    function beforeRequest( requestType ) {
      $scope.requestError = undefined
      $scope.requestPending = requestType
    }
    function afterRequestSuccessful( requestType ) {
      $scope.requestError = undefined
      $scope.requestPending = undefined
    }
    function afterRequestFailure( pointId, ex, statusCode ) {
      $scope.requestError = '"Exception: ' + ex.exception + ' - ' + ex.message
      $scope.requestPending = undefined
    }

    $scope.nis = function() {
      if( $scope.requestPending)
        return false
      var m = $scope.model.currentMeasurement
      if( m.shortQuality !== 'R' && m.shortQuality !== 'N') {
        beforeRequest( 'nis')
        gbMeasurementValueRest.nis($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
      }
    }
    $scope.override = function() {
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      beforeRequest( 'override')
      gbMeasurementValueRest.override($scope.model.id, $scope.editMode.value, $scope.editMode.valueType, this, afterRequestSuccessful, afterRequestFailure)
    }
    $scope.remove = function() {
      if( $scope.requestPending)
        return false

      var m = $scope.model.currentMeasurement
      beforeRequest( 'remove')
      gbMeasurementValueRest.remove($scope.model.id, this, afterRequestSuccessful, afterRequestFailure)
    }
    $scope.onBlur = function() {
      if( ! $scope.editMode)
        return
      $scope.editMode = undefined
    }
    $scope.onFocus = function() {

    }

    $scope.edit = function() {
      if( $scope.editMode)
        return

      $scope.editMode = {
        value: $scope.model.currentMeasurement.value
      }
      $scope.removeTooltip = self.getRemoveTooltip()
    }

  }]).

  directive( 'gbMeasurementValue', function(){
    return {
      restrict: 'E', // Element name
      // The template HTML will replace the directive.
      replace: true,
      scope: {
             model  : '=',
             notify: '&'
      },
      templateUrl: 'greenbus.views.template/measurementValue/measurementValue.html',
      controller: 'gbMeasurementValueController',
      link: function(scope, element, attrs, controller) {
        var focusedElement
        element.on('click', function () {
          console.log( 'gbMeasurementValue onClick')
          if ( ! scope.editMode) {
            scope.edit()
            scope.$digest()
            console.log( 'gbMeasurementValue onClick selecting input')
            var input = element.find( 'input')
            if( input && input.length > 0) {
              input[0].select()
              focusedElement = input[0];
            }
          }
        })
        element.on('blur', function () {
          focusedElement = null;
        })

        var selectItem = attrs.selectItem || 'selectItem'
        scope.$parent[selectItem] = controller.selectItem
        scope.$parent.uncheckItem = controller.uncheckItem
        controller.notifyParent = function( state) {
          scope.notify( {state: state})
        }
      }
    }
  }).

  filter('buttonDisabled', function() {
    return function(disabled, classes) {
      return disabled ? classes + ' disabled' : classes
    };
  })


