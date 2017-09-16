import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  PanResponder,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Icon } from 'react-native-elements';
import * as firebase from 'firebase';
import base64 from 'base-64';

// Gets Dimensions of User Screen
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: width - 20,
    // Height is 70% of screen
    height: height * 0.82,
    // Adds top margin to Card
    // top: (height * 0.3) / 2,
    overflow: 'hidden',
    backgroundColor: 'white',
    margin: 10,
    borderWidth: 1,
    borderColor: 'lightgrey',
    borderRadius: 8,
  },
});

export default class Card extends Component {
  componentWillMount() {
    this.pan = new Animated.ValueXY();

    // PanResponder Object
    this.cardPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // If card has touch request no other touches can be accepted
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: Animated.event([
        null,
        // Updates Animated Values
        { dx: this.pan.x, dy: this.pan.y },
      ]),
      // Determines how much Card has moved and which direction
      onPanResponderRelease: (e, { dx }) => {
        // Gets absolute value of movement
        const absDx = Math.abs(dx);
        // Determines swipe direction
        const direction = absDx / dx;
        // Statement returns true if card is swiped to the positive direction, i.e. to the right
        const swipedRight = direction > 0;

        // Threshold to Swipe Card off Screen
        if (absDx > 120) {
          // Animates Card off Screen
          Animated.decay(this.pan, {
            velocity: { x: 3 * direction, y: 0 },
            deceleration: 0.995,
          }).start(() => this.props.onSwipeOff(swipedRight, this.props.profile.listingId));
        } else {
          // Returns Card to Center when Dropped
          Animated.spring(this.pan, {
            toValue: { x: 0, y: 0 },
            friction: 4.5,
          }).start();
        }
      },
    });
  }

  render() {
    // Expands profile prop into individual variables values
    const { title, price, description, imageByteArray, uid, first_name } = this.props.profile;
    // console.log('PROPS', this.props.profile);
    let decodedImageByteArray = base64.decode(imageByteArray);
    // Interpolates touch gesture values to degrees
    const rotateCard = this.pan.x.interpolate({
      inputRange: [-200, 0, 200],
      outputRange: ['10deg', '0deg', '-10deg'],
    });
    const iconAlpha = this.pan.x.interpolate({
      inputRange: [-300, 0, 300],
      outputRange: ['rgba(80, 80, 80, 0.9)', 'rgba(128, 128, 128, 0.0)', 'rgba(0, 127, 123, 0.9)'],
    });
    // Connects Animation Values to Card Component
    const animatedStyle = {
      transform: [
        { translateX: this.pan.x },
        { translateY: this.pan.y },
        { rotate: rotateCard },
      ],
    };
    const overlayStyle = {
      backgroundColor: iconAlpha,
      flex: 1,
      borderRadius: 7,
    };

    return (
      <Animated.View
        // Spread operator deconstructs panHandlers Object
        {...this.cardPanResponder.panHandlers}
        style={[styles.card, animatedStyle, overlayStyle]}
      >
        <Image
          style={{ flex: 1, borderRadius: 7 }}
          source={{ uri: `data:image/jpeg;base64,${decodedImageByteArray}` }}
          borderRadius={7}
        >
          <Animated.View style={[overlayStyle]} />

        <View style={{ marginBottom: 10, marginTop: 10, marginLeft: 15, marginRight: 15, padding: 15, borderRadius: 8, backgroundColor: 'rgba( 255, 255, 255, .9)' }}>
          <Text style={{ fontSize: 20 }}>{ title }, ${ price }</Text>
          {// if description variable is assigned it's displayed here, if not an empty View is
            description ? <Text style={{ fontSize: 15, color: '#393939' }}>{ description }</Text> : <View />}
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-around', flexDirection: 'row', bottom: 5 }}>
          <Icon
            raised
            reverse
            name='times'
            type='font-awesome'
            color='rgba( 128, 128, 128, .9)'
            size={30}
            onPress={() => Animated.spring(this.pan, {
              toValue: { x: -600, y: 0 },
              friction: 3.5,
            }).start(() => this.props.onSwipeOff(false, this.props.profile.listingId))}
          />
          <Icon
            raised
            reverse
            name='flag'
            type='font-awesome'
            color='rgba( 193, 85, 85, .9)'
            size={15}
            onPress={() =>
              Alert.alert(
                'Flag as Inappropriate?',
                `Are you SURE you'd like to report the ${this.props.profile.title} as inappropriate?`,
                [
                  { text: 'Cancel', onPress: () => console.log('Cancelled') },
                  { text: 'Yes',
                    onPress: () => {
                      Animated.spring(this.pan, {
                        toValue: { x: -600, y: 0 },
                        friction: 3.5,
                      }).start(() => this.props.onSwipeOff(false, this.props.profile.listingId));
                      firebase.database().ref(`listingsBySeller/${this.props.profile.uid}/${this.props.profile.listingId}/flags`)
                      .transaction((currentFlags) => {
                        return currentFlags + 1;
                      });
                      firebase.database().ref(`users/${this.props.profile.uid}/flags`)
                      .transaction((currentFlags) => {
                        return currentFlags + 1;
                      });
                    } },
                ],
                { cancelable: true },
              )
              }
          />
            <Icon
              raised
              reverse
              name='heart'
              type='font-awesome'
              color='rgba( 0, 127, 123, .9)'
              size={30}
              onPress={() => Animated.spring(this.pan, {
                toValue: { x: 600, y: 0 },
                friction: 3.5,
              }).start(() => this.props.onSwipeOff(true, this.props.profile.listingId))}
            />
        </View>
        </Image>
      </Animated.View>
    );
  }
}
