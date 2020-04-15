def get_obj(model, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except Exception as e:
        return None


def split_name(name):
    """
    Split name into first name and last name
    :param name:
    :return: tuple
    """
    word_list = name.split(' ')
    first_name = word_list[0]
    last_name = ' '.join(w for w in word_list[1:])
    return first_name, last_name