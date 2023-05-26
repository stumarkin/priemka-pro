import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import BannerView from './BannerView';
import { 
    Alert,
    View, 
    ScrollView, 
    TextInput,
} from 'react-native';
import { 
    ThemeProvider, 
    Button, 
    Divider,
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


export default function RefundCalculationScreen ({navigation, route}) {
 
    const {square, designTypes, designTypeSelected} = route.params;
    const refund = square*designTypes[designTypeSelected].pricePerMetr
    const [username, setUsername] = useState('')
    const [userphone, setUserphone] = useState('+7')
    const [deviceId, setDeviceId] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Initial
    useEffect(() => {
        getDeviceId()
        .then(deviceId =>{ 
            setDeviceId(deviceId)
            track('RefundScreen', { deviceId }); 
        } )
    }, []);  


    // Sending to server
    const sendRequestRefundForm = () => {
        
        const apiURL = 'https://priemka-pro.ru/api/v2/?method=requestrefund';
        setIsLoading(true);
        axios.post( 
            apiURL,
            {deviceId, username, userphone, square, refund, designType: designTypes[designTypeSelected].name},
            {headers: { 'Content-Type': 'multipart/form-data'} }
        ).then(response => {
            if (response.data.result){
                Alert.alert( 'Запрос отправлен! 👍', 'Мы получили ваш запрос, в течении дня с вами свяжется наш специалист по взысканию и ответит на все ваши вопросы.')
                setUsername('')
                setUserphone('+7')
                navigation.goBack();
            } else {
                Alert.alert( 'Что-то не так... 🤔', 'Не удалось отправить запрос, попробуйте еще раз. В случае повторной ошибки, пожалуйста, напишите запрос в службу поддержки.')
            }
            setIsLoading(false);
        })
        .catch( err => {
            console.log('sendRequestRefundForm failed: ' + err);
        });
    }


    return (
        <ScrollView>
            <View style={{ padding: 20 }}>
                <ThemeProvider theme={theme}>
                     
                    <BannerView 
                        backgroundImage='https://alfabank.servicecdn.ru/site-upload/de/46/60/1_desktop.png'
                        header={refund.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' ₽'}
                        text={`Это сумма к возмещению для вашей квартиры площадью ${square}м² ${designTypes[designTypeSelected].name.toLowerCase()}\nРасчитана на основе статистики других пользователей.`}

                    />
                    <Divider width={10} style={{ opacity: 0 }} />
                    
                    <BannerView 
                        header='Возмещение "под ключ"'
                        text={
                            `Вы ни за что не платите до поступления к вам возмещения. Все необходимые мероприятия за наш счет:\n\n` +
                            `– Экспертиза (обычно 25 000₽)\n\n` +
                            `– Отправка требований\n\n` +
                            `– Судебное производство\n\n` +
                            `– Исполнительное производство\n\n` +
                            `– Аппеляция`
                        }
                        actionControls={
                            <>
                                <TextInput
                                    style={{
                                        height: 40,
                                        borderBottomColor: theme.lightColors.grey4,
                                        borderBottomWidth: 2,
                                        fontSize: 19,
                                        padding: 2,
                                        marginRight: 10,
                                        width: 255
                                    }}
                                    inputMode='text'
                                    onChangeText={setUsername}
                                    placeholder="Ваше имя"
                                    value={username}
                                />
                                <Divider width={20} style={{ opacity: 0 }} />

                                
                                <TextInput
                                    style={{
                                        height: 40,
                                        borderBottomColor: theme.lightColors.grey4,
                                        borderBottomWidth: 2,
                                        fontSize: 19,
                                        padding: 2,
                                        marginRight: 10,
                                        width: 255
                                    }}
                                    inputMode='numeric'
                                    onChangeText={setUserphone}
                                    placeholder="Ваш телефон"
                                    value={userphone}
                                />

                                
            
                                <Divider width={20} style={{ opacity: 0 }} />
                                <Button
                                    title='Узнать подробнее' 
                                    loading={isLoading}
                                    disabled={isLoading}
                                    onPress={() =>{
                                        if ( username!='' && + userphone > 1000000000){
                                            track('RequestRefundPressed', { deviceId });
                                            sendRequestRefundForm();
                                            // navigation.navigate('RefundCalculation', {title: '', square, designTypes, designTypeSelected});
                                        } else {
                                            Alert.alert('Что-то забыли...', 'Укажите ваше имя и контактный телефон для отправки запрос на консультацию по услуге.')
                                        }
                                    }}
                                />
                            </>
                        }
                    />
                    
                    {/* <Text style={{ textAlign: 'center', fontSize: 12 }}>{deviceId}</Text> */}
                    <StatusBar style="auto" />
                </ThemeProvider>
            </View>
        </ScrollView>
    );
}

