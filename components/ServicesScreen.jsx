import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import BannerView from './BannerView';

import { 
    Alert,
    View, 
    ScrollView, 
    Pressable, 
    ImageBackground
} from 'react-native';
import { 
    ThemeProvider, 
    Text, 
    Button, 
    ListItem,
    Divider,
    Icon,
    Chip
} from '@rneui/themed';
import { theme } from './theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { init, track } from '@amplitude/analytics-react-native';
init('c8698f1fccc72a1744388b9e1341b833', 'stumarkin@mail.ru');


const getDeviceId = async () => {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
        deviceId = generateId(19);
        await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
}

export default function ServicesScreen ({navigation}) {
 
    const [deviceId, setDeviceId] = useState(null)
    const [banners, setBanners] = useState([]);
    const [bannerSection, setBannerSection] = useState(null);
    const [counter, setCounter] = useState( 0 )

    // Initial
    useEffect(() => {
        // Device Id
        getDeviceId()
        .then(deviceId =>{ 
            setDeviceId(deviceId)
            track('ServicesScreen', { deviceId }); 
              
        } )
        
        // Banner loading
        axios.get(`https://priemka-pro.ru/api/v2/?method=getservicesbanners`)
        .then(res => {
            if (typeof res.data == 'object'){
                setBanners( res.data );
            } else {
                console.log( 'Banner load fail. API response:\n' + res.data ) 
            }
        }) 
    }, []);  

    useEffect(() => {
        // something to do on inside webview action
        console.log('counter update')
    }, [counter]);  




    // Banners with sections sorting
    const bannersUI = banners.filter( ({section}) => !bannerSection || section==bannerSection ).map( (banner, i) => (
        <BannerView {...banner} i  onPress={() =>{
            track('BannerPress', { deviceId, banner: banner.header });
            navigation.navigate('Webview', {title: '', deviceid: deviceId, callback: ()=>{setCounter(counter+1)}, url: banner.webviewUrl + (banner.webviewUrl.indexOf('?')>-1 ? '&' : '?') + 'deviceid=' + deviceId })
         }}/>
    ));
    const bannerSections = banners?.map(({section})=>(section)).filter( (item, i, arr) => arr.indexOf(item) === i );

    const bannersSectionsUI = bannerSections.map( (section, i) => (
        <Button
            key={i}
            title={section} 
            containerStyle={{ marginRight: 15, marginBottom:15}}
            buttonStyle={{ 
                backgroundColor: ( bannerSection!=section ? '#DEDEDE' : '#555'),
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 5,
                fontWeight: 100,
                padding: 4,
            }}
            titleStyle={{ 
                fontWeight: '500',
                color: ( bannerSection!=section ? 'black' : 'white'),
                fontSize: 14,

            }}
            onPress={ ()=>{
                setBannerSection( bannerSection!=section ? section : null )
            }}
        >

        </Button>
    ));


    return (
        <ScrollView>
            <View style={{ padding: 20, paddingTop: 100}}>
                <ThemeProvider theme={theme}>
                    <Text style={{fontSize: 36, fontWeight: 700}}>Услуги</Text>
                    <View style={[{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap'
                                }]}
                    >
                        {bannersSectionsUI}
                    </View>
                    {bannersUI}
                    <Text style={{ textAlign: 'center', fontSize: 12 }}>{deviceId}</Text>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </View>
        </ScrollView>
    );
}