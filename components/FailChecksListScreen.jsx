import { useState, useEffect } from 'react';
import { 
    ScrollView, 
    Pressable,
    Platform,
    Share
} from 'react-native';
import { 
    Icon,
    ThemeProvider, 
    Text, 
    Button, 
    Dialog,
    CheckBox,
    Card,
    Divider,
    Skeleton
  } from '@rneui/themed';
import { theme } from './theme';


export default function FailChecksListScreen ({navigation, route}) {
    
    const onShare = async () => {
        try {
          const result = await Share.share({
            message: route.params.content,
          });
          if (result.action === Share.sharedAction) {
            if (result.activityType) {
              // shared with activity type of result.activityType
            } else {
              // shared
            }
          } else if (result.action === Share.dismissedAction) {
            // dismissed
          }
        } catch (error) {
          Alert.alert(error.message);
        }
      };
    
      useEffect(() => {
            navigation.setOptions({
              headerRight: () => (
                <Button 
                    onPress={onShare}
                    title={'Отправить'}
                    type="clear" 
                    color="primary"
                    titleStyle={{ fontSize: 17}}
                />
              ),
            });
      }, [navigation]);

    return (
        <ScrollView
            style={{
                backgroundColor: '#FFF'
            }}
        >
            <Text
                style={{
                    padding: 20,
                    fontSize: 16
                }}
            >
                { route.params.content }
            </Text>
        </ScrollView>
    )
}