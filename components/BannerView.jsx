import { 
    View, 
    Pressable, 
    ImageBackground
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
        actionControls 
    } = props;
    return (
        <View key={i}>
            <Pressable onPress={onPress}>
                <ImageBackground 
                    source={ backgroundImage ? {uri: backgroundImage} : null } 
                    resizeMode="cover" 
                    style={{
                        backgroundColor: backgroundColor, 
                        padding: 20,
                        borderRadius: 10,
                        overflow: 'hidden' 
                    }}
                >
                    {
                        header ? (
                            <>
                                <ListItem key={0} containerStyle={{backgroundColor: 'transparent', padding: 0}}>
                                    <ListItem.Content>
                                        <ListItem.Title style={{color: textColor, fontSize: 22, fontWeight: 700}}>{header}</ListItem.Title>
                                    </ListItem.Content>
                                    {isClosable ? <Icon type='ionicon' name="close" color="grey"/> : ''}
                                </ListItem>
                                <Divider width={10} style={{ opacity: 0 }} />
                            </>
                        ) : null
                    }

                    { text ? <Text style={{width: (backgroundImage ? '70%' : '100%'), color: textColor, fontSize: 14, marginBottom: 0 }}>{text}</Text> : null }
                   
                    { backgroundImage || actionControls ? (<Divider width={10} style={{ opacity: 0 }} />) : null } 
                    

                    { actionControls }
                </ImageBackground>
            </Pressable>
            <Divider width={10} style={{ opacity: 0 }} />
        </View>
    )
}