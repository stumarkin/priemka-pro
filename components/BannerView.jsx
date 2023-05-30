import { 
    View, 
    Pressable, 
    ImageBackground,
    Image
} from 'react-native';
import { 
    Text, 
    ListItem,
    Divider,
    Icon,
} from '@rneui/themed';


export default function BannerView (props) {
    const {
        onPress, 
        i, 
        backgroundImage, 
        backgroundColor = (backgroundColor || '#FFF'), 
        header, 
        isClosable = (isClosable || false), 
        textColor = (textColor || '#000'), 
        text, 
        actionControls,
        button
    } = props;
    return (
        <View key={i}>
            <Pressable onPress={onPress}>
                <ImageBackground 
                    // source={ backgroundImage ? {uri: backgroundImage} : null } 
                    resizeMode="cover" 
                    style={{
                        backgroundColor: backgroundColor, 
                        padding: 0,
                        borderRadius: 10,
                        overflow: 'hidden' 
                    }}
                >
                    {   // Header
                        header ? (
                            <>
                                <ListItem 
                                    key={0} 
                                    containerStyle={{
                                        backgroundColor: 'transparent', 
                                        paddingTop: 20, 
                                        paddingHorizontal: 20, 
                                        paddingBottom: 0,
                                    }}
                                >
                                    <ListItem.Content>
                                        <ListItem.Title style={{color: textColor, fontSize: 22, fontWeight: 700}}>{header}</ListItem.Title>
                                    </ListItem.Content>
                                    {isClosable ? <Icon type='ionicon' name="close" color="grey"/> : ''}
                                </ListItem>
                                <Divider width={10} style={{ opacity: 0 }} />
                            </>
                        ) : null
                    }

                    <View
                        style={{
                            justifyContent: 'space-between', 
                            flexDirection: 'row',
                        }}
                    >
                        {   // Text
                            text ? (
                                <Text 
                                    style={{
                                        width: (backgroundImage ? '70%' : '100%'), 
                                        color: textColor, 
                                        fontSize: 14, 
                                        marginBottom: 0,
                                        paddingLeft: 20,
                                        paddingBottom: 20 
                                    }}
                                >
                                    {text}
                                </Text>
                            ) : null 
                        }
                        {   // Text
                            backgroundImage ? (
                                <Image
                                    width='30%' 
                                    style={{ }}
                                    source={ backgroundImage ? {uri: backgroundImage} : null } 
                                    resizeMode="contain" 
                                    
                              />
                            ) : null 
                        }
                    </View>




                   
                    {/* { backgroundImage || actionControls ? (<Divider width={10} style={{ opacity: 0 }} />) : null }  */}
                    

                    { 
                        actionControls ? (
                            <View
                                style={{ paddingHorizontal: 20, paddingVertical: 10 }}
                            >
                                { actionControls }
                            </View>
                        ) : null
                    }

                    { 
                        button ? (
                            <View
                                style={{ paddingHorizontal: 10, paddingBottom: 10 }}
                            >
                                { button }
                            </View>
                        ) : null
                    }
                </ImageBackground>
            </Pressable>
            <Divider width={10} style={{ opacity: 0 }} />
        </View>
    )
}