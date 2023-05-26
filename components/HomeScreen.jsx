
import { useState, useEffect } from 'react';
import BannerView from './BannerView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { 
    Alert,
    View, 
    ScrollView, 
    Pressable, 
    LinearGradient
} from 'react-native';
import { 
    ThemeProvider, 
    Text, 
    Button, 
    ListItem,
    Divider,
    Icon
} from '@rneui/themed';
import { theme } from './theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { init, track } from '@amplitude/analytics-react-native';
init('c8698f1fccc72a1744388b9e1341b833', 'stumarkin@mail.ru');


const inclineWord = ( howMany, ofWhat, humanicStyle = false ) => {
    switch (ofWhat){
        case "недостаток":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} недостатков`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 0: if (humanicStyle) {return `пока не нашли недостатков`}
                case 1: return `${howMany} недостаток`
                case 2:
                case 3:
                case 4: return `${howMany} недостатка`
                default: return `${howMany} недостатков`
            }
        
        case "проверка":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} проверок`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 1: return `${howMany} проверка`
                case 2:
                case 3:
                case 4: return `${howMany} проверки`
                default: return `${howMany} проверок`
            }

        case "приёмка":
            if ([11,12,13,14].includes(howMany)){
                return `${howMany} приёмок`;
            }
            switch ( howMany - (Math.floor(howMany/10)*10) ){
                case 1: return `${howMany} приёмка`
                case 2:
                case 3:
                case 4: return `${howMany} приёмки`
                default: return `${howMany} приёмок`
            }
        default: return `${howMany} ${ofWhat}`
    }
  }

const  generateId = (length) => {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let i = 0;
    while (i < length) {
        i += 1;
        result += i%5 ? [...characters][Math.floor(Math.random() * characters.length)] : '-';
    }
    return result;
}

const getDeviceId = async () => {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
        deviceId = generateId(19);
        await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
}




export default function HomeScreen ({navigation}) {
    // AsyncStorage.clear(); 
    const [storedForms, setStoredForms] = useState([]);
    const [banners, setBanners] = useState([]);
    const [deviceId, setDeviceId] = useState(null)
    const [isPro, setIsPro] = useState( false )
    const [counter, setCounter] = useState( 0 )

    
    const updateStoredForms = () => {
        AsyncStorage.getAllKeys()
        .then( keys => {
            AsyncStorage.multiGet( keys.filter( key => key.indexOf('form') > -1) )
            .then( res => setStoredForms(res))
        })
    }



    // Initial
    useEffect(() => {
        // Device Id
        getDeviceId()
        .then(deviceId =>{ 
            setDeviceId(deviceId)
            track('HomeScreenView', { deviceId });
              
        } )
        
        // Previous Forms
        updateStoredForms()

        // Banner loading
        axios.get(`https://priemka-pro.ru/api/v2/?method=getbanners`)
        .then(res => {
            if (typeof res.data == 'object'){
                setBanners( res.data );
            } else {
                console.log( 'Banner load fail. API response:\n' + res.data ) 
            }
        }) 
    }, []); 

    // isPro
    useEffect(()=>{
        if (deviceId) {
            axios.get(`https://priemka-pro.ru/api/v2/?method=ispro&deviceid=${deviceId}`)
            .then(res => {
                if (typeof res.data == 'object'){
                    setIsPro( res.data.isPro );
                } else {
                    console.log( 'isPro load fail. API response:\n' + res.data ) 
                }
                
            })
        }
    },[deviceId, counter]) 


    // Banners with sections sorting
    const bannersUI = {}
    const bannerSections = banners.map(({section})=>(section)).filter( (item, i, arr) => arr.indexOf(item) === i );
    bannerSections.forEach( section_ => {bannersUI[section_] = banners.filter( ({section}) => section == section_ ).map( (banner, i) => (
        <BannerView {...banner} i  onPress={() =>{
            track('BannerPress', { deviceId, banner: banner.header }); 
            navigation.navigate('Webview', {title: '', deviceid: deviceId, callback: ()=>{setCounter(counter+1)}, url: banner.webviewUrl + (banner.webviewUrl.indexOf('?')>-1 ? '&' : '?') + 'deviceid=' + deviceId })
         }}/>
    ))} )


    return (
        <ScrollView>
            <View style={{ padding: 20, paddingTop: 100}}>
                <ThemeProvider theme={theme}>
                    <View
                        style={[{justifyContent: 'space-between', flexDirection: 'row',}]}
                    >
                        <Text style={{fontSize: 36, fontWeight: 700, marginBottom: 20}}>Приёмка</Text>
                        
                        {
                            isPro ? (
                                <Button 
                                    title="Pro подключен 🚀"
                                    containerStyle={{ }} 
                                    buttonStyle={{ 
                                        marginTop: 12,
                                        width: 130,
                                        backgroundColor: '#DDD',
                                        borderColor: 'transparent',
                                        borderWidth: 0,
                                        borderRadius: 5,
                                        padding: 4,
                                    }}
                                    titleStyle={{
                                        fontSize: 12,
                                        color: 'black'
                                    }}
                                    onPress={ ()=>navigation.navigate('Webview', {title: '', deviceid: deviceId, callback: ()=>{setCounter(counter+1)}, url: 'https://priemka-pro.ru/webview/pro/?deviceid=' + deviceId }) }
                                />
                            ) : null
                        }
                    </View>

                    {!isPro ? bannersUI.top : bannersUI.pro}

                    <BannerView 
                        i="new"
                        header='Новая приёмка'
                        text= { !isPro ? <Text style={{ fontSize: 14 }}>
                                            Доступно еще {inclineWord(5 - (storedForms.length || 0), 'приёмка')}.{'\n'}На Pro ограничений не будет.
                                        </Text> : <Text style={{ fontSize: 14 }}>
                                            Pro подключен. Вас не остановить!
                                        </Text>   
                        }
                        actionControls={ <Button
                                            title='Новая приёмка' 
                                            onPress={() =>{
                                                if ( isPro || storedForms.length<5 ){
                                                track('NewAcceptancePress', { deviceId });
                                                    navigation.navigate('Apartment', {updateStoredForms: updateStoredForms});
                                                } else {
                                                    Alert.alert('Время переходить на Pro 🚀', 'Бесплатный тариф ограничен приёмкой 5 квартир.\nПереходите на Pro, в нем нет ограничений.')
                                                }
                                            }}
                                        />
                        }
                    />                
                    
                    <BannerView 
                        i="prev"
                        header='Предыдущие приёмки'
                        text= { storedForms.length==0 ? 'Здесь появятся все ваши приемки. Указывайте адрес приёмки для удобного поиска в общем списке' : null }
                        actionControls={
                            storedForms.map( ([key, valueJSON]) => {
                                const value = JSON.parse(valueJSON);
                                return (
                                        <ListItem 
                                            key={key} 
                                            containerStyle={{paddingHorizontal: 0}}
                                            onPress={ () =>{ 
                                                track('PreviousAcceptancePress', { deviceId });
                                                navigation.navigate('Apartment', {formId: key.split('_')[1], updateStoredForms, isPro}) 
                                            }}
                                        >
                                            <ListItem.Content>
                                                <ListItem.Title style={{fontWeight: 600}}>{value.address ? value.address : 'Без адреса'}</ListItem.Title>
                                                <ListItem.Subtitle style={{fontSize: 14}}>{inclineWord(value.checksCountTotal, "проверка")}, {inclineWord(value.failChecksCountTotal, "недостаток", true)}</ListItem.Subtitle>
                                            </ListItem.Content>
                                            <ListItem.Chevron />
                                        </ListItem>
                                )
                        })}
                    />                

                    {bannersUI.bottom}

                    <Text style={{ textAlign: 'center', fontSize: 12 }}>{deviceId}</Text>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </View>
        </ScrollView>
    );
  };