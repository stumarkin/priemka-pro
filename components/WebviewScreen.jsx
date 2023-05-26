import { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    Pressable,
    Platform,
    Share
} from 'react-native';
import { 
    Icon,
} from '@rneui/themed';
import { theme } from './theme';
import { WebView } from 'react-native-webview';



export default function WebviewScreen ({navigation, route}) {
    const callback = () => route.params.callback();

    const onShare = async () => {
        try {
          const result = await Share.share({
            message: route.params.url,
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
    
      handleWebViewNavigationStateChange = (newNavState) => {
      
        const { url } = newNavState;
        if (!url) return;
    
        if (url.includes('#callback')) {
          callback()
        }
      };

    useEffect(() => {
        if (route.params.isSharable){
            navigation.setOptions({
              headerRight: () => (
                <Pressable onPress={onShare} >
                    <Icon type='ionicon' name={Platform.OS=='ios' ? "share-outline" : "share-social"} color="blue" />
                </Pressable>
              ),
            });
        }
      }, [navigation]);

    return (
        <WebView
            ref={(ref) => (webview = ref)}
            originWhitelist={['*']}
            source={{ uri: route.params.url }}
            onNavigationStateChange={this.handleWebViewNavigationStateChange}
        />
    );
};

const styles = StyleSheet.create({
  mb10: {
    marginBottom: 10,
  },
  ml10: {
    paddingLeft: 20,
  },
});